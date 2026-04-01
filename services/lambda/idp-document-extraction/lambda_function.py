import json
import logging
import os
import time
import urllib.parse
import uuid
from datetime import datetime, timedelta, timezone

import boto3
import urllib3
from azure.storage.blob import BlobSasPermissions, BlobServiceClient, generate_blob_sas


logger = logging.getLogger()
logger.setLevel(logging.INFO)

http = urllib3.PoolManager()

s3 = boto3.client("s3")
dynamodb = boto3.resource("dynamodb")


DDB_TABLE = os.environ.get("DDB_TABLE", "")
OUTPUT_BUCKET = os.environ.get("OUTPUT_BUCKET", "")
BASE_URL = os.environ["BASE_URL"]

AZURE_CU_ENDPOINT = (
    os.environ.get("AZURE_CU_ENDPOINT")
    or os.environ.get("AZURE_CONTENT_UNDERSTANDING_ENDPOINT", "")
).rstrip("/")
AZURE_CU_API_KEY = os.environ.get("AZURE_CU_API_KEY") or os.environ.get(
    "CONTENT_UNDERSTANDING_KEY", ""
)
AZURE_CU_API_VERSION = os.environ.get("AZURE_CU_API_VERSION") or os.environ.get(
    "API_VERSION", "2025-11-01"
)
AZURE_CU_ANALYZER_MAP = os.environ.get("AZURE_CU_ANALYZER_MAP", "{}")
AZURE_CU_ANALYZER_DEFAULT = os.environ.get(
    "AZURE_CU_ANALYZER_DEFAULT"
) or os.environ.get("ANALYZER_ID", "")
AZURE_CU_TIMEOUT_SECONDS = int(os.environ.get("AZURE_CU_TIMEOUT_SECONDS", "180"))
AZURE_CU_POLL_INTERVAL_SECONDS = float(
    os.environ.get("AZURE_CU_POLL_INTERVAL_SECONDS", "2")
)
AZURE_CU_PROCESSING_LOCATION = os.environ.get("AZURE_CU_PROCESSING_LOCATION", "")
AZURE_STORAGE_CONNECTION_STRING = os.environ.get("AZURE_STORAGE_CONNECTION_STRING", "")
AZURE_STORAGE_CONTAINER = os.environ.get("AZURE_STORAGE_CONTAINER", "idp")


def lambda_handler(event, context):
    start = time.time()

    bucket = event["detail"]["bucket"]["name"]
    key = urllib.parse.unquote_plus(event["detail"]["object"]["key"])

    parts = key.split("/")
    submission_id = parts[0]
    document_id = parts[1]
    file_name = parts[-1]

    logger.info("File received | %s | %s", bucket, key)

    classification = parse_classifier_payload(event)
    analyzer_id = resolve_analyzer_id(classification, file_name)

    logger.info(
        "Azure CU extraction started | analyzer=%s | classification=%s",
        analyzer_id,
        json.dumps(classification),
    )

    try:
        file_bytes = s3.get_object(Bucket=bucket, Key=key)["Body"].read()
        file_size = len(file_bytes)

        cu_result = analyze_with_azure_cu(file_bytes, analyzer_id, file_name)
        structured = normalize_cu_output(
            cu_result=cu_result,
            classification=classification,
            file_name=file_name,
            analyzer_id=analyzer_id,
        )

        json_key = f"{submission_id}/{document_id}/v0/{file_name}.json"

        s3.put_object(
            Bucket=OUTPUT_BUCKET,
            Key=json_key,
            Body=json.dumps(structured),
            ContentType="application/json",
        )

        logger.info("Structured output saved: %s", json_key)

        document_type = structured.get("documentType", "Unknown")

        update_file_contains_extracted_data(
            submission_id=submission_id,
            document_id=document_id,
            extracted_s3_key=json_key,
            document_type=document_type,
            file_size=file_size,
            status="Ready for Review",
        )

        request_payload = {
            "documentType": document_type,
            "documentExtractedKey": json_key,
            "analyzerId": analyzer_id,
        }

        payload = {
            "workflowInstanceId": document_id,
            "nodeName": "DOCUMENT_INGESTION",
            "status": "COMPLETED",
            "message": "Azure Content Understanding extraction completed",
            "requestPayload": request_payload,
            "responsePayload": {
                "documentType": document_type,
                "pageCount": len(structured.get("sections", [])),
                "analyzerId": analyzer_id,
            },
        }

        call_external_api(
            url=f"{BASE_URL}/api/workflow/logNode",
            method="POST",
            headers={"Content-Type": "application/json"},
            payload=payload,
            id_path="id",
        )

        logger.info(
            "Azure CU extraction completed | duration_seconds=%.2f",
            time.time() - start,
        )

        return {
            "statusCode": 200,
            "body": json.dumps(structured, indent=2),
        }

    except Exception:
        logger.exception("Azure Content Understanding extraction failed")
        raise


def parse_classifier_payload(event):
    body = event.get("body", {})
    if isinstance(body, str):
        try:
            return json.loads(body)
        except json.JSONDecodeError:
            logger.warning("Classifier payload body is not valid JSON: %s", body)
            return {}
    if isinstance(body, dict):
        return body
    return {}


def resolve_analyzer_id(classification, file_name):
    try:
        analyzer_map = json.loads(AZURE_CU_ANALYZER_MAP or "{}")
    except json.JSONDecodeError as exc:
        raise ValueError("AZURE_CU_ANALYZER_MAP must be valid JSON") from exc

    normalized_map = {str(k).strip().lower(): v for k, v in analyzer_map.items()}

    candidates = []
    form_type = classification.get("form_type") or {}
    lob = classification.get("lob") or {}

    candidate_values = [
        form_type.get("code"),
        form_type.get("description"),
        classification.get("document_type"),
        lob.get("code"),
        lob.get("description"),
        file_name,
    ]

    for value in candidate_values:
        if not value:
            continue
        lowered = str(value).strip().lower()
        candidates.append(lowered)
        candidates.append(normalize_lookup_key(lowered))

    for candidate in candidates:
        analyzer_id = normalized_map.get(candidate)
        if analyzer_id:
            return analyzer_id

    if AZURE_CU_ANALYZER_DEFAULT:
        return AZURE_CU_ANALYZER_DEFAULT

    raise ValueError(
        "No Azure Content Understanding analyzer mapping found for "
        f"file '{file_name}' and no AZURE_CU_ANALYZER_DEFAULT is configured."
    )


def normalize_lookup_key(value):
    return "".join(ch if ch.isalnum() else "_" for ch in value).strip("_")


def upload_bytes_to_blob_and_get_sas(file_bytes, file_name):
    if not AZURE_STORAGE_CONNECTION_STRING:
        raise ValueError("AZURE_STORAGE_CONNECTION_STRING is required for blob upload")

    blob_service = BlobServiceClient.from_connection_string(
        AZURE_STORAGE_CONNECTION_STRING
    )
    container_client = blob_service.get_container_client(AZURE_STORAGE_CONTAINER)

    if not container_client.exists():
        container_client.create_container()

    blob_name = f"{uuid.uuid4()}-{file_name}"
    blob_client = container_client.get_blob_client(blob_name)
    blob_client.upload_blob(file_bytes, overwrite=True)

    account_name = blob_service.account_name
    credential = blob_service.credential
    account_key = getattr(credential, "account_key", None)

    if not account_name or not account_key:
        raise ValueError(
            "Unable to resolve Azure Blob account name/account key from connection string"
        )

    sas_token = generate_blob_sas(
        account_name=account_name,
        container_name=AZURE_STORAGE_CONTAINER,
        blob_name=blob_name,
        account_key=account_key,
        permission=BlobSasPermissions(read=True),
        expiry=datetime.now(timezone.utc) + timedelta(hours=1),
    )

    return (
        f"https://{account_name}.blob.core.windows.net/"
        f"{AZURE_STORAGE_CONTAINER}/{blob_name}?{sas_token}"
    )


def analyze_with_azure_cu(file_bytes, analyzer_id, file_name):
    url = (
        f"{AZURE_CU_ENDPOINT}/contentunderstanding/analyzers/"
        f"{urllib.parse.quote(analyzer_id, safe='')}:analyze"
        f"?api-version={urllib.parse.quote(AZURE_CU_API_VERSION)}"
    )

    if AZURE_CU_PROCESSING_LOCATION:
        url += (
            "&processingLocation="
            f"{urllib.parse.quote(AZURE_CU_PROCESSING_LOCATION)}"
        )

    headers = {
        "Ocp-Apim-Subscription-Key": AZURE_CU_API_KEY,
        "Content-Type": "application/json",
    }

    sas_url = upload_bytes_to_blob_and_get_sas(file_bytes, file_name)
    request_body = {"inputs": [{"url": sas_url}]}

    response = http.request(
        method="POST",
        url=url,
        body=json.dumps(request_body).encode("utf-8"),
        headers=headers,
        timeout=AZURE_CU_TIMEOUT_SECONDS,
    )

    if response.status >= 400:
        raise RuntimeError(
            "Azure CU analyze failed: "
            f"status={response.status}, body={response.data.decode('utf-8', errors='ignore')}"
        )

    operation_location = (
        response.headers.get("Operation-Location")
        or response.headers.get("operation-location")
    )

    if not operation_location:
        raise RuntimeError("Azure CU response did not include Operation-Location")

    logger.info("Azure CU job accepted | analyzer=%s", analyzer_id)
    return poll_azure_cu_result(operation_location, analyzer_id)


def poll_azure_cu_result(operation_location, analyzer_id):
    headers = {"Ocp-Apim-Subscription-Key": AZURE_CU_API_KEY}
    deadline = time.time() + AZURE_CU_TIMEOUT_SECONDS

    while time.time() < deadline:
        response = http.request(
            method="GET",
            url=operation_location,
            headers=headers,
            timeout=AZURE_CU_TIMEOUT_SECONDS,
        )

        if response.status >= 400:
            raise RuntimeError(
                "Azure CU polling failed: "
                f"status={response.status}, body={response.data.decode('utf-8', errors='ignore')}"
            )

        payload = json.loads(response.data.decode("utf-8"))
        status = str(payload.get("status", "")).lower()

        logger.info("Azure CU poll | analyzer=%s | status=%s", analyzer_id, status)

        if status == "succeeded":
            return payload

        if status in {"failed", "cancelled"}:
            raise RuntimeError(
                "Azure CU analysis did not succeed: "
                f"{json.dumps(payload, ensure_ascii=True)}"
            )

        time.sleep(AZURE_CU_POLL_INTERVAL_SECONDS)

    raise TimeoutError(
        f"Azure CU analysis timed out after {AZURE_CU_TIMEOUT_SECONDS} seconds"
    )


def normalize_cu_output(cu_result, classification, file_name, analyzer_id):
    result = cu_result.get("result", cu_result)
    contents = result.get("contents") or []
    document_content = next(
        (content for content in contents if content.get("kind") == "document"),
        contents[0] if contents else {},
    )

    fields = document_content.get("fields") or result.get("fields") or {}
    page_lookup = build_page_lookup(document_content)

    pages = {}
    for field_name, field_value in fields.items():
        normalized = normalize_field(field_value, page_lookup)
        page_numbers = sorted(collect_pages(normalized)) or [1]

        for page_number in page_numbers:
            projected = project_node_for_page(normalized, page_number)
            if projected is None:
                continue

            page_entry = pages.setdefault(page_number, {"page": page_number})
            page_entry[field_name] = projected

    if not pages:
        pages[1] = {
            "page": 1,
            "ExtractedFields": {
                "rawResult": {
                    "value": json.dumps(result, ensure_ascii=True),
                    "confidence_score": None,
                    "bounding_box": None,
                    "page": 1,
                }
            },
        }

    form_type = classification.get("form_type") or {}
    document_type = (
        form_type.get("description")
        or form_type.get("code")
        or classification.get("document_type")
        or result.get("analyzerId")
        or analyzer_id
        or file_name
    )

    return {
        "documentType": document_type,
        "sections": [pages[page] for page in sorted(pages)],
        "source": {
            "provider": "azure-content-understanding",
            "analyzerId": result.get("analyzerId", analyzer_id),
            "apiVersion": AZURE_CU_API_VERSION,
        },
    }


def build_page_lookup(document_content):
    pages = document_content.get("pages") or []
    return {
        page.get("pageNumber"): {
            "width": page.get("width"),
            "height": page.get("height"),
            "unit": page.get("unit"),
        }
        for page in pages
        if page.get("pageNumber") is not None
    }


def normalize_field(field, page_lookup, inherited_page=None):
    field_type = (field or {}).get("type")
    parsed_source = parse_source(field.get("source"), page_lookup)
    page_number = parsed_source["page"] if parsed_source else inherited_page or 1
    bounding_box = parsed_source["bounding_box"] if parsed_source else None
    confidence_score = normalize_confidence(field.get("confidence"))

    if field_type == "object":
        value_object = field.get("valueObject") or {}
        return {
            key: normalize_field(value, page_lookup, page_number)
            for key, value in value_object.items()
        }

    if field_type == "array":
        return [
            normalize_field(value, page_lookup, page_number)
            for value in field.get("valueArray") or []
        ]

    if field_type == "boolean":
        return {
            "checked": bool(resolve_scalar_value(field)),
            "confidence_score": confidence_score,
            "bounding_box": bounding_box,
            "page": page_number,
        }

    return {
        "value": stringify_scalar_value(resolve_scalar_value(field)),
        "confidence_score": confidence_score,
        "bounding_box": bounding_box,
        "page": page_number,
    }


def resolve_scalar_value(field):
    value_keys = [
        "valueString",
        "valueInteger",
        "valueNumber",
        "valueBoolean",
        "valueDate",
        "valueTime",
        "valueDateTime",
        "valuePhoneNumber",
        "valueSelectionMarkState",
        "valueCurrency",
    ]

    for key in value_keys:
        if key in field:
            return field[key]

    for key, value in field.items():
        if key.startswith("value") and key not in {"valueObject", "valueArray"}:
            return value

    return None


def stringify_scalar_value(value):
    if value is None:
        return ""
    if isinstance(value, dict):
        if "amount" in value:
            return str(value["amount"])
        return json.dumps(value, ensure_ascii=True)
    if isinstance(value, list):
        return json.dumps(value, ensure_ascii=True)
    if isinstance(value, bool):
        return "true" if value else "false"
    return str(value)


def normalize_confidence(confidence):
    if confidence is None:
        return None
    if confidence <= 1:
        return round(confidence * 100, 2)
    return round(confidence, 2)


def parse_source(source, page_lookup):
    if not source or not isinstance(source, str):
        return None

    if not source.startswith("D(") or not source.endswith(")"):
        return None

    raw_values = [value.strip() for value in source[2:-1].split(",") if value.strip()]
    if len(raw_values) < 3:
        return None

    try:
        page_number = int(float(raw_values[0]))
        coordinates = [float(value) for value in raw_values[1:]]
    except ValueError:
        return None

    if len(coordinates) < 4:
        return {"page": page_number, "bounding_box": None}

    x_values = coordinates[0::2]
    y_values = coordinates[1::2]

    left = min(x_values)
    top = min(y_values)
    width = max(x_values) - left
    height = max(y_values) - top

    page_meta = page_lookup.get(page_number) or {}
    page_width = page_meta.get("width")
    page_height = page_meta.get("height")

    if page_width and page_height:
        bounding_box = {
            "left": left / page_width,
            "top": top / page_height,
            "width": width / page_width,
            "height": height / page_height,
        }
    else:
        bounding_box = None

    return {"page": page_number, "bounding_box": bounding_box}


def is_leaf_node(node):
    return isinstance(node, dict) and (
        {"value", "confidence_score", "page"}.issubset(node.keys())
        or {"checked", "confidence_score", "page"}.issubset(node.keys())
    )


def collect_pages(node):
    pages = set()

    if is_leaf_node(node):
        pages.add(node.get("page", 1))
        return pages

    if isinstance(node, list):
        for item in node:
            pages.update(collect_pages(item))
        return pages

    if isinstance(node, dict):
        for value in node.values():
            pages.update(collect_pages(value))

    return pages


def project_node_for_page(node, page_number):
    if is_leaf_node(node):
        return node if node.get("page") == page_number else None

    if isinstance(node, list):
        projected_items = [
            project_node_for_page(item, page_number) for item in node
        ]
        projected_items = [item for item in projected_items if item is not None]
        return projected_items or None

    if isinstance(node, dict):
        projected_object = {}
        for key, value in node.items():
            projected = project_node_for_page(value, page_number)
            if projected is not None:
                projected_object[key] = projected
        return projected_object or None

    return None


def update_file_contains_extracted_data(
    submission_id,
    document_id,
    extracted_s3_key,
    document_type,
    file_size,
    status="PENDING",
):
    table = dynamodb.Table(DDB_TABLE)

    response = table.get_item(Key={"submissionId": submission_id})

    item = response.get("Item")
    if not item:
        raise Exception(f"Submission not found: {submission_id}")

    files = item.get("file_contains", [])

    file_index = None
    for idx, file_item in enumerate(files):
        if file_item.get("documentId") == document_id:
            file_index = idx
            break

    if file_index is None:
        raise Exception(f"documentId {document_id} not found")

    table.update_item(
        Key={"submissionId": submission_id},
        UpdateExpression=f"""
            SET file_contains[{file_index}].extractedDataS3Key = :s3key,
                file_contains[{file_index}].documentType = :docType,
                file_contains[{file_index}].ingestion_status = :status,
                file_contains[{file_index}].fileSize = :fileSize,
                file_contains[{file_index}].fileProgress = :fileProgress,
                file_contains[{file_index}].createdAt = :updatedAt,
                updatedAt = :updatedAt
        """,
        ExpressionAttributeValues={
            ":s3key": extracted_s3_key,
            ":docType": document_type,
            ":fileSize": file_size,
            ":fileProgress": 80,
            ":status": status,
            ":updatedAt": int(time.time()),
        },
    )


def call_external_api(
    url: str,
    method: str = "GET",
    headers: dict = None,
    payload: dict = None,
    params: dict = None,
    path_params: dict = None,
    id_path: str = "id",
    timeout: int = 10,
):
    try:
        if path_params:
            url = url.format(**path_params)

        if params:
            from urllib.parse import urlencode

            url = f"{url}?{urlencode(params)}"

        logger.info("Calling external API: %s %s", method, url)

        body = None
        if payload:
            body = json.dumps(payload).encode("utf-8")

        response = http.request(
            method=method.upper(),
            url=url,
            body=body,
            headers=headers,
            timeout=timeout,
        )

        if response.status >= 400:
            raise Exception(f"API failed: {response.status}")

        response_data = json.loads(response.data.decode("utf-8"))
        logger.info("API response: %s", response_data)

        api_id = response_data.get(id_path)

        if not api_id:
            raise Exception(f"ID '{id_path}' not found")

        return api_id

    except Exception as exc:
        logger.error(str(exc))
        raise

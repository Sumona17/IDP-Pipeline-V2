import json
import boto3
import urllib3
import logging
import os
import time

dynamodb = boto3.resource("dynamodb")
DDB_TABLE = os.environ["DYNAMO_DB_TABLE"]

logger = logging.getLogger()
logger.setLevel(logging.INFO)

http = urllib3.PoolManager()

BASE_URL = os.environ["BASE_URL"]


s3_client = boto3.client("s3")

def lambda_handler(event, context):

    print("Event:", json.dumps(event))

    bucket_name = event["detail"]["bucket"]["name"]
    s3_key = event["detail"]["object"]["key"]

    parts = s3_key.split("/")

    if len(parts) < 3:
        raise ValueError(f"Invalid key format: {s3_key}")

    submission_id = parts[0]
    document_id = parts[1]
    file_name = "/".join(parts[2:])

    head_obj = s3_client.head_object(
        Bucket=bucket_name,
        Key=s3_key
    )

    file_size = head_obj["ContentLength"]
    content_type = head_obj.get("ContentType", "unknown")

    request_payload = {
        "fileName": file_name,
        "fileSize": file_size
    }

    update_file_metadata(
        submission_id=submission_id,
        document_id=document_id,
        file_size=file_size,
        file_progress=30
    )



    payload = {
        "workflowInstanceId": document_id,
        "nodeName": "DOCUMENT_WATCHER",
        "status": "COMPLETED",
        "message": "Document uploaded",
        "requestPayload": request_payload,
        "responsePayload": {
            "detail": {
                "bucket": {"name": bucket_name},
                "object": {"key": s3_key}
            },
            "submissionId": submission_id,
            "documentId": document_id,
            "fileName": file_name,
            "fileSize": file_size,
            "contentType": content_type
        }
    }

    call_external_api(
        url=f"{BASE_URL}/api/workflow/logNode",
        method="POST",
        headers={"Content-Type": "application/json"},
        payload=payload,
        id_path="id"
    )

    print(f"Uploaded file: {file_name}, size={file_size}")

    return {
        "detail": {
            "bucket": {"name": bucket_name},
            "object": {"key": s3_key}
        },
        "submissionId": submission_id,
        "documentId": document_id,
        "fileName": file_name,
        "fileSize": file_size,
        "contentType": content_type
    }


def call_external_api(
    url: str,
    method: str = "GET",
    headers: dict = None,
    payload: dict = None,
    params: dict = None,
    path_params: dict = None,
    id_path: str = "id",
    timeout: int = 10
):
    try:
        # Replace path params
        if path_params:
            url = url.format(**path_params)

        # Add query params manually
        if params:
            from urllib.parse import urlencode
            url = f"{url}?{urlencode(params)}"

        logger.info(f"Calling external API: {method} {url}")

        body = None
        if payload:
            body = json.dumps(payload).encode("utf-8")

        response = http.request(
            method=method.upper(),
            url=url,
            body=body,
            headers=headers,
            timeout=timeout
        )

        if response.status >= 400:
            raise Exception(f"API failed: {response.status}")

        response_data = json.loads(response.data.decode("utf-8"))
        logger.info(f"API response: {response_data}")

        api_id = response_data.get(id_path)

        if not api_id:
            raise Exception(f"ID '{id_path}' not found")

        return api_id

    except Exception as e:
        logger.error(str(e))
        raise

def update_file_metadata(submission_id, document_id, file_size, file_progress):
    table = dynamodb.Table(DDB_TABLE)

    response = table.get_item(
        Key={"submissionId": submission_id}
    )

    item = response.get("Item")
    if not item:
        raise Exception(f"Submission not found: {submission_id}")

    files = item.get("file_contains", [])

    file_index = None
    for idx, f in enumerate(files):
        if f.get("documentId") == document_id:
            file_index = idx
            break

    if file_index is None:
        raise Exception(f"documentId {document_id} not found")

    table.update_item(
        Key={"submissionId": submission_id},
        UpdateExpression=f"""
            SET file_contains[{file_index}].fileSize = :fileSize,
                file_contains[{file_index}].fileProgress = :fileProgress,
                updatedAt = :updatedAt
        """,
        ExpressionAttributeValues={
            ":fileSize": file_size,
            ":fileProgress": file_progress,
            ":updatedAt": int(time.time())
        }
    )

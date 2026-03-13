import os
import uuid
import boto3
import traceback
import json
import urllib3
import logging
import time
from datetime import datetime
from typing import List
from .s3_client import get_s3_client
from .models import PresignRequest, PresignResponse


logger = logging.getLogger()
logger.setLevel(logging.INFO)

http = urllib3.PoolManager()

BUCKET_NAME = os.environ["BUCKET_NAME"]
URL_EXPIRY_SECONDS = int(os.environ.get("URL_EXPIRY_SECONDS", 600))
BASE_URL = os.environ["BASE_URL"]
WORKFLOW_ID = os.environ["WORKFLOW_ID"]

dynamodb = boto3.resource("dynamodb")
dynamo_db_table_name = os.environ.get("DYNAMO_DB_TABLE")


def generate_presigned_url(
    s3_client,
    request: PresignRequest,
    submission_id: str
) -> PresignResponse:

    # document_id = str(uuid.uuid4())
    
    document_id = call_external_api(
        url=f"{BASE_URL}/api/workflow/start/{WORKFLOW_ID}",
        method="GET",
        headers={"Content-Type": "application/json"},
        id_path="id"
    )

    s3_key = f"{submission_id}/{document_id}/{request.fileName}"

    url = s3_client.generate_presigned_url(
        ClientMethod="put_object",
        Params={
            "Bucket": BUCKET_NAME,
            "Key": s3_key,
            "ContentType": request.contentType,
        },
        ExpiresIn=URL_EXPIRY_SECONDS,
        HttpMethod="PUT",
    )

    return PresignResponse(
        fileName=request.fileName,
        s3Key=s3_key,
        uploadUrl=url,
        submissionId=submission_id,
        documentId=document_id
    )


def generate_presigned_urls(
    requests: List[PresignRequest]
) -> List[PresignResponse]:

    s3_client = get_s3_client()

    submission_id = requests[0].submissionId or str(uuid.uuid4())

    user_name = (requests[0].userName or "").strip()

    created_date = current_date()
    responses = []

    for req in requests:

        presigned = generate_presigned_url(
            s3_client,
            req,
            submission_id
        )

        insert_into_db(
            submission_id=submission_id,
            file_name=presigned.fileName,
            created_at_date=created_date,
            s3_key=presigned.s3Key,
            document_id=presigned.documentId,
            user_name=user_name
        )

        responses.append(presigned)
    
    return responses

def current_date():
    return datetime.utcnow().strftime("%Y-%m-%d")

def insert_into_db(submission_id, file_name, created_at_date, s3_key, document_id, user_name):

    table = dynamodb.Table(dynamo_db_table_name)

    file_object = {
        "documentId": document_id,
        "fileName": file_name,
        "s3Key": s3_key,
        "fileProgress": 10,
        "ingestion_status": "Ingestion in Progress"
    }

    try:
        response = table.update_item(
            Key={
                "submissionId": str(submission_id)
            },
            UpdateExpression="""
                SET #status = if_not_exists(#status, :status),
                    incomingPath = if_not_exists(incomingPath, :incoming),
                    senderEmail = if_not_exists(senderEmail, :sender),
                    createdAt = if_not_exists(createdAt, :created),
                    file_contains = list_append(if_not_exists(file_contains, :empty_list), :new_file)
            """,
            ExpressionAttributeNames={
                "#status": "status"
            },
            ExpressionAttributeValues={
                ":status": "New",
                ":incoming": "DOCUMENT_UPLOAD",
                ":sender": user_name,
                ":created": int(time.time()),
                ":empty_list": [],
                ":new_file": [file_object]
            },
            ReturnValues="UPDATED_NEW"
        )

        return 200

    except Exception as e:
        print(e)
        traceback.print_exc()
        return 500

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
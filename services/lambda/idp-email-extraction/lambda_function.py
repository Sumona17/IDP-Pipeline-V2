import json
import boto3
import email
import uuid
import os
import time
import traceback
import urllib3
import logging
from datetime import datetime
from email.message import EmailMessage


logger = logging.getLogger()
logger.setLevel(logging.INFO)

http = urllib3.PoolManager()

s3 = boto3.client("s3")
dynamodb = boto3.resource("dynamodb")

bucket_name_for_upload = os.environ.get("BUCKET_NAME")
dynamo_db_table_name = os.environ.get("DYNAMO_DB_TABLE")

BASE_URL = os.environ["BASE_URL"]
WORKFLOW_ID = os.environ["WORKFLOW_ID"]


def lambda_handler(event, context):

    submission_id = str(uuid.uuid4())
    print(f"Submission ID: {submission_id}")

    file_obj = event["Records"][0]
    bucket_name = file_obj["s3"]["bucket"]["name"]
    key_name = file_obj["s3"]["object"]["key"]

    complete_email_file = s3.get_object(
        Bucket=bucket_name,
        Key=key_name
    )

    msg: EmailMessage = email.message_from_bytes(
        complete_email_file["Body"].read()
    )

    subject = msg["Subject"]
    sender_email = get_sender_from_email(msg)
    insert_date = current_date()

    for part in msg.walk():

        if part.get_content_disposition() != "attachment":
            continue
        
        filename = part.get_filename() or "attachment.pdf"
        content_type = part.get_content_type()
        payload = part.get_payload(decode=True)

        # document_id = str(uuid.uuid4())
        document_id = call_external_api(
            url=f"{BASE_URL}/api/workflow/start/{WORKFLOW_ID}",
            method="GET",
            headers={"Content-Type": "application/json"},
            id_path="id"
        )


        s3_key = f"{submission_id}/{document_id}/{filename}"

        s3.put_object(
            Bucket=bucket_name_for_upload,
            Key=s3_key,
            Body=payload,
            ContentType=content_type
        )

        status_code = insert_into_db(
            submission_id=submission_id,
            file_name=filename,
            created_at_date=insert_date,
            s3_key=s3_key,
            document_id=document_id,
            sender_email=sender_email
        )

        if status_code != 200:
            print("Error inserting metadata")

    return {
        "statusCode": 200,
        "body": json.dumps("Email processed successfully")
    }

def get_sender_from_email(msg):
    from_address = msg["From"]
    name, email_address = email.utils.parseaddr(from_address)
    return email_address

def current_date():
    return datetime.now().strftime("%Y-%m-%d")

def insert_into_db(submission_id,file_name,created_at_date,s3_key,document_id,sender_email):

    table = dynamodb.Table(dynamo_db_table_name)

    file_object = {
        "documentId": document_id,
        "fileName": file_name,
        "s3Key": s3_key,
        "ingestion_status": "Ingestion in Progress"
    }

    try:
        table.update_item(
            Key={
                "submissionId": str(submission_id)
            },
            UpdateExpression="""
                SET #status = if_not_exists(#status, :status),
                    incomingPath = if_not_exists(incomingPath, :incoming),
                    senderEmail = if_not_exists(senderEmail, :sender),
                    createdAt = if_not_exists(createdAt, :created),
                    file_contains = list_append(
                        if_not_exists(file_contains, :empty_list),
                        :new_file
                    )
            """,
            ExpressionAttributeNames={
                "#status": "status"
            },
            ExpressionAttributeValues={
                ":status": "New",
                ":incoming": "EMAIL_UPLOAD",
                ":sender": sender_email,
                ":created": int(time.time()),
                ":empty_list": [],
                ":new_file": [file_object]
            }
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

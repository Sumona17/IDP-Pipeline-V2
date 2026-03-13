import json
import os
import boto3
from botocore.exceptions import ClientError
import urllib3
import logging


logger = logging.getLogger()
logger.setLevel(logging.INFO)

http = urllib3.PoolManager()

AWS_REGION = os.environ["AWS_REGION"]
MODEL_ID = os.environ["MODEL_ID"]
BASE_URL = os.environ["BASE_URL"]

s3_client = boto3.client('s3')
bed_rock_client = boto3.client('bedrock-runtime', region_name = AWS_REGION)

def lambda_handler(event, context):

    bucket_name = event["detail"]["bucket"]["name"]
    key_name = event["detail"]["object"]["key"]

    parts = key_name.split("/")

    if len(parts) < 3:
        raise ValueError(f"Invalid S3 key format: {key_name}")

    submission_id = parts[0]
    document_id = parts[1]
    file_name = "/".join(parts[2:])

    tmp_storage = "/tmp/" + file_name.split("/")[-1]

    download_from_s3(bucket_name, key_name, tmp_storage)

    doc_intent = get_document_intent(tmp_storage)
    json_doc_intent = clean_and_parse_json(doc_intent)

    print("Document intent:", json_doc_intent)

    payload = {
        "workflowInstanceId": document_id,
        "nodeName": "DOCUMENT_CLASSIFIER",
        "status": "COMPLETED",
        "message": "Document Classification completed",
        "requestPayload": {
            "bucket": {
                "name": bucket_name
            },
            "object": {
                "key": key_name
            }
        },
        "responsePayload": json_doc_intent
    }

    call_external_api(
        url=f"{BASE_URL}/api/workflow/logNode",
        method="POST",
        headers={"Content-Type": "application/json"},
        payload=payload,
        id_path="id"
    )

    return {
        "statusCode": 200,
        "body": json_doc_intent,
        "submissionId": submission_id,
        "documentId": document_id,
        "fileName": file_name,
        "detail": {
            "bucket": {
                "name": bucket_name
            },
            "object": {
                "key": key_name
            }
        }
    }


def download_from_s3(bucket_name, object_key, local_path):
    """Downloads an item from s3 to local"""
    s3_client.download_file(bucket_name, object_key, local_path)

def clean_and_parse_json(response_text):
    """
    Cleans markdown code blocks from JSON response and parses it
    """
    try:
        cleaned_text = response_text.strip()
        
        if cleaned_text.startswith('```json'):
            cleaned_text = cleaned_text[7:] 
        elif cleaned_text.startswith('```'):
            cleaned_text = cleaned_text[3:]
        
        if cleaned_text.endswith('```'):
            cleaned_text = cleaned_text[:-3]
        
        json_data = json.loads(cleaned_text.strip())
        return json_data
    
    except json.JSONDecodeError as e:
        print(f"Failed to parse JSON: {e}")
        print(f"Raw response: {response_text}")
        raise ValueError(f"Invalid JSON response: {response_text}")

def get_document_intent(file_path):
    """Getting document intent from File"""
    return_response_text = ""

    with open(file_path, "rb") as file:
        doc_bytes = file.read()
    
    conversation = [
        {
            "role": "user",
            "content": [
                {
                    "text": (
                            "You are an insurance document classifier. "
                            "Return ONLY valid JSON (no markdown, no explanation). "

                            "Required JSON structure: "
                            "{ "
                            "\"file_name\": \"string\", "
                            "\"document_type\": \"one of: plain_text_pdf | scanned_pdf | "
                            "pdf_with_images_and_text | image | plain_text | unknown\", "
                            "\"form_type\": { "
                                "\"code\": \"lowercase snake_case identifier\", "
                                "\"description\": \"Human readable full form name\" "
                            "}, "
                            "\"lob\": { "
                                "\"code\": \"one of: property | casualty | auto | "
                                "workers_compensation | general_liability | umbrella | commercial | unknown\", "
                                "\"description\": \"Human readable insurance domain name\" "
                            "} "
                            "} "

                            "Rules: "
                            "- Extract actual file name from the document. "
                            "- form_type.code must be stable and lowercase snake_case "
                            "(example: acord_140, acord_125, loss_run). "
                            "- form_type.description must be full official form title. "
                            "- lob.code must be one of the allowed values only. "
                            "- lob.description must be a readable business name "
                            "(example: Commercial Property, General Liability, Workers Compensation). "
                            "- If unsure, use 'unknown' for code and description. "
                        )
                },
                {
                    "document": {
                        "format": "pdf",
                        "name": "Insurance Document",
                        "source": {"bytes": doc_bytes}
                    }
                }
            ]
        }
    ]

    try:
        response = bed_rock_client.converse(
            modelId=MODEL_ID,
            messages=conversation,
            inferenceConfig={"maxTokens": 512, "temperature": 0.3}
        )

        response_text = response["output"]["message"]["content"][0]["text"]
        print("The response from the model is ", response_text)
        return response_text

    except (ClientError, Exception) as e:
        print(f"Couldn't process document. Here's why: {e}")
        raise e

    return return_response_text

# def get_document_intent(file_path):
#     """Getting document intent from File"""
#     return_response_text = ""

#     with open(file_path, "rb") as file:
#         doc_bytes = file.read()
    
#     conversation = [
#         {
#             "role": "user",
#             "content": [
#                 {
#                     "text": "You are an insurance document classifier. "
# 							"Return ONLY valid JSON (no markdown formatting) with: "
# 							"1) file_name extracted from this document. "
# 							"2) document_type classification from these values only: "
# 							"- plain_text_pdf: PDF containing only selectable text and no embedded images. "
# 							"- scanned_pdf: PDF created from scanned images where text is not selectable. "
# 							"- pdf_with_images_and_text: PDF containing both selectable text and embedded images/logos/tables. "
# 							"- image: standalone image file (jpg, png, etc.). "
# 							"- plain_text: non-PDF plain text file. "
# 							"- unknown: if unable to determine. "
# 							"3) lob (line_of_business): Identify the primary insurance or financial domain of the document. "
# 							"Return lob in lowercase snake_case format. "
# 							"If unsure, return 'unknown'. "
# 							"Output JSON format example: "
# 							"{ "
# 							"\"file_name\": \"Actual File Name\", "
# 							"\"document_type\": \"pdf_with_images_and_text\", "
# 							"\"lob\": \"property\" "
# 							"}"
#                 },
#                 {
#                     "document": {
#                         "format": "pdf",
#                         "name": "Insurance Document",
#                         "source": {"bytes": doc_bytes}
#                     }
#                 }
#             ]
#         }
#     ]

#     try:
#         response = bed_rock_client.converse(
#             modelId=MODEL_ID,
#             messages=conversation,
#             inferenceConfig={"maxTokens": 512, "temperature": 0.3}
#         )

#         response_text = response["output"]["message"]["content"][0]["text"]
#         print("The response from the model is ", response_text)
#         return response_text

#     except (ClientError, Exception) as e:
#         print(f"Couldn't process document. Here's why: {e}")
#         raise e

#     return return_response_text

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

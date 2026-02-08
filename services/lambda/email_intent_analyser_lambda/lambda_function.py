import json
import os
import boto3
from botocore.exceptions import ClientError

AWS_REGION = os.environ["AWS_REGION"]
MODEL_ID = os.environ["MODEL_ID"]

s3_client = boto3.client('s3')
bed_rock_client = boto3.client('bedrock-runtime', region_name = AWS_REGION)

def lambda_handler(event, context):
    
    bucket_name = event["detail"]["bucket"]["name"]
    key_name = event["detail"]["object"]["key"]
    tmp_storage = '/tmp/'+key_name.split('/')[-1]
    download_from_s3(bucket_name, key_name, tmp_storage)
    doc_intent = get_document_intent(tmp_storage)
    json_doc_intent = clean_and_parse_json(doc_intent)
    print("The document intent is ", json_doc_intent)
    
    return {
        'statusCode': 200,
        'body': json_doc_intent,
        'detail':{
            'bucket':{
                'name': bucket_name
            },
            'object':{
                'key': key_name
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
    with open(file_path,"rb") as file:
        doc_bytes = file.read()
    conversation = [
        {
            "role":"user",
            "content":[
                {"text": "You are an insurance agent. Return ONLY valid JSON (no markdown formatting) with the filename extracted from this document. Example: {\"filename\": \"Actual File Name\"}"},
                {
                    "document":{
                        "format":"pdf",
                        "name":"Insurance Document",
                        "source":{"bytes": doc_bytes}
                    }
                }
            ]
        }
    ]
    try:
        response = bed_rock_client.converse(
            modelId = MODEL_ID,
            messages = conversation,
            inferenceConfig={"maxTokens":512,"temperature":0.5}
        )

        response_text = response["output"]["message"]["content"][0]["text"]
        print("The response from the model is ",response_text)
        return response_text
    except(ClientError, Exception) as e:
        print(f"Couldn't download file. Here's why: {e}")
        raise e
    return return_response_text


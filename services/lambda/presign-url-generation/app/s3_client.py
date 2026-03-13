import boto3
import os

REGION =  os.environ["AWS_REGION"]

def get_s3_client():
    return boto3.client("s3", region_name=REGION)

import json
from typing import List
from .models import PresignRequest
from .service import generate_presigned_urls


def parse_request(event) -> List[PresignRequest]:
    body = json.loads(event["body"])
    return [PresignRequest(**item) for item in body]


def build_response(data, status_code=200):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
        "body": json.dumps(data),
    }


def lambda_handler(event, context):
    try:
        requests = parse_request(event)
        responses = generate_presigned_urls(requests)

        return build_response(
            [r.__dict__ for r in responses]
        )

    except Exception as e:
        return build_response(
            {"message": str(e)},
            status_code=500
        )

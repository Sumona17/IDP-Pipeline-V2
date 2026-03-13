from dataclasses import dataclass

@dataclass
class PresignRequest:
    fileName: str
    contentType: str
    submissionId: Optional[str] = None
    userName: Optional[str] = None


@dataclass
class PresignResponse:
    fileName: str
    s3Key: str
    uploadUrl: str
    submissionId: str
    documentId: str

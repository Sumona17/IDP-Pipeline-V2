package com.exavalu.idp.middleware.repository;

import com.exavalu.idp.middleware.dto.SubmissionDocumentInfoResponseDto;
import com.exavalu.idp.middleware.dto.SubmissionFileMetaDto;
import com.exavalu.idp.middleware.dto.SubmissionSummaryResponseDto;

import java.util.List;

public interface SubmissionRepository {

    List<SubmissionSummaryResponseDto> fetchPendingSubmissions();
    List<SubmissionDocumentInfoResponseDto> fetchDocumentsBySubmissionId(String submissionId, boolean isApprovalWindow);
    List<SubmissionSummaryResponseDto> fetchSubmissionsByIds(List<String> submissionIds);
    void updateReviewInProgress(String submissionId, String documentId);
    SubmissionFileMetaDto getFileMeta(String submissionId, String documentId);
    void updateExtractedDataKey(String submissionId, String documentId,
                                String newKey, String updatedBy, String updatedAt);
    void updateReviewCompletedStatus(String submissionId, String documentId, String updatedBy, String updatedAt);
    void pendingForApprovalStatus(String submissionId, String documentId, String updatedBy, String updatedAt);
    void updateExtractionDataStatus(String submissionId, String documentId, String updatedBy, String updatedAt);
    List<SubmissionSummaryResponseDto> fetchSubmissionsByStatus(List<String> statuses);
}

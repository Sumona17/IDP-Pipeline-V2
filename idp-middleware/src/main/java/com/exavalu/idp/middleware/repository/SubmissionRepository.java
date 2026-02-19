package com.exavalu.idp.middleware.repository;

import com.exavalu.idp.middleware.dto.SubmissionDocumentInfoResponseDto;
import com.exavalu.idp.middleware.dto.SubmissionSummaryResponseDto;

import java.util.List;

public interface SubmissionRepository {

    List<SubmissionSummaryResponseDto> fetchPendingSubmissions();
    List<SubmissionDocumentInfoResponseDto> fetchDocumentsBySubmissionId(String submissionId);
    List<SubmissionSummaryResponseDto> fetchSubmissionsByIds(List<String> submissionIds);
    void updateReviewInProgress(String submissionId, String documentId);
}

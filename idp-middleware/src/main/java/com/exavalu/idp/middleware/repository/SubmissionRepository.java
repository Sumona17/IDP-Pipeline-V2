package com.exavalu.idp.middleware.repository;

import com.exavalu.idp.middleware.dto.SubmissionDocumentInfo;
import com.exavalu.idp.middleware.dto.SubmissionSummary;

import java.util.List;

public interface SubmissionRepository {

    List<SubmissionSummary> fetchPendingSubmissions();
    List<SubmissionDocumentInfo> fetchDocumentsBySubmissionId(String submissionId);
    List<SubmissionSummary> fetchSubmissionsByIds(List<String> submissionIds);
}

package com.exavalu.idp.middleware.service;

import com.exavalu.idp.middleware.dto.SubmissionDocumentInfo;
import com.exavalu.idp.middleware.dto.SubmissionSummary;
import com.exavalu.idp.middleware.dto.ValidateDataInfo;
import com.exavalu.idp.middleware.dto.ValidateDataRequestDto;

import java.util.List;

public interface SubmissionRecordService {

    List<SubmissionSummary> fetchUsedRecords();
    List<SubmissionDocumentInfo> fetchDocumentsBySubmissionId(String submissionId);
    ValidateDataInfo getValidateData(ValidateDataRequestDto request);
}

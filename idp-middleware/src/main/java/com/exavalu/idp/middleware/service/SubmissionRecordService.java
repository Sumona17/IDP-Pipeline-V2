package com.exavalu.idp.middleware.service;

import com.exavalu.idp.middleware.dto.SubmissionDocumentInfoResponseDto;
import com.exavalu.idp.middleware.dto.SubmissionSummaryResponseDto;
import com.exavalu.idp.middleware.dto.ValidateDataInfoResponseDto;
import com.exavalu.idp.middleware.dto.ValidateDataRequestDto;

import java.util.List;

public interface SubmissionRecordService {

    List<SubmissionSummaryResponseDto> fetchUsedRecords();
    List<SubmissionDocumentInfoResponseDto> fetchDocumentsBySubmissionId(String submissionId);
    ValidateDataInfoResponseDto getValidateData(ValidateDataRequestDto request);
}

package com.exavalu.idp.middleware.service;

import com.exavalu.idp.middleware.dto.*;

import java.util.List;

public interface SubmissionRecordService {

    List<SubmissionSummaryResponseDto> fetchUsedRecords();
    List<SubmissionDocumentInfoResponseDto> fetchDocumentsBySubmissionId(String submissionId);
    ValidateDataInfoResponseDto getValidateData(ValidateDataRequestDto request);
    String updateExtractedDataVersion(UpdateExtractedDataRequestDto dataRequestDto, String updatedBy);

}

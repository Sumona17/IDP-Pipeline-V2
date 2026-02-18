package com.exavalu.idp.middleware.service.impl;

import com.exavalu.idp.middleware.dto.*;
import com.exavalu.idp.middleware.repository.SubmissionRepository;
import com.exavalu.idp.middleware.repository.impl.SubmissionRepositoryImpl;
import com.exavalu.idp.middleware.service.S3FileService;
import com.exavalu.idp.middleware.service.SubmissionRecordService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SubmissionRecordServiceImpl implements SubmissionRecordService {

    private static final Logger log = LoggerFactory.getLogger(SubmissionRecordServiceImpl.class);

    private final SubmissionRepository repository;

    private final S3FileService s3FileService;

    @Override
    public List<SubmissionSummary> fetchUsedRecords() {
        return repository.fetchPendingSubmissions();
    }

    @Override
    public List<SubmissionDocumentInfo> fetchDocumentsBySubmissionId(String submissionId) {
        return repository.fetchDocumentsBySubmissionId(submissionId);
    }

    @Override
    public ValidateDataInfo getValidateData(ValidateDataRequestDto request) {

        ValidateDataInfo dataInfo = new ValidateDataInfo();
        dataInfo.setExtractedData(s3FileService.getJsonNodeFromS3Key(request.getExtractedDataKey()));
        dataInfo.setEncodedPdfData(s3FileService.getBase64FromS3Uri(request.getOriginalFileKey()));

        return dataInfo;
    }
}

package com.exavalu.idp.middleware.service.impl;

import com.exavalu.idp.middleware.dto.*;
import com.exavalu.idp.middleware.repository.SubmissionRepository;
import com.exavalu.idp.middleware.service.S3FileService;
import com.exavalu.idp.middleware.service.SubmissionRecordService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SubmissionRecordServiceImpl implements SubmissionRecordService {

    private static final Logger log = LoggerFactory.getLogger(SubmissionRecordServiceImpl.class);

    private final SubmissionRepository repository;
    private final S3FileService s3FileService;
    private final WorkflowLogClient workflowLogClient;

    private final ObjectMapper objectMapper;

    @Override
    public List<SubmissionSummaryResponseDto> fetchUsedRecords() {
        return repository.fetchPendingSubmissions();
    }

    @Override
    public List<SubmissionDocumentInfoResponseDto> fetchDocumentsBySubmissionId(String submissionId) {
        return repository.fetchDocumentsBySubmissionId(submissionId);
    }

    @Override
    public ValidateDataInfoResponseDto getValidateData(ValidateDataRequestDto request) {

        ValidateDataInfoResponseDto dataInfo = new ValidateDataInfoResponseDto();
        dataInfo.setExtractedData(s3FileService.getJsonNodeFromS3Key(request.getExtractedDataKey()));
        dataInfo.setEncodedPdfData(s3FileService.getBase64FromS3Uri(request.getOriginalFileKey()));
        repository.updateReviewInProgress(request.getSubmissionId(), request.getDocumentId());

        return dataInfo;
    }

    @Override
    public String updateExtractedDataVersion(UpdateExtractedDataRequestDto dataRequestDto, String updatedBy) {

        String submissionId = dataRequestDto.getSubmissionId();
        String documentId = dataRequestDto.getDocumentId();

        SubmissionFileMetaDto fileMeta = repository.getFileMeta(submissionId, documentId);

        String currentKey = fileMeta.getExtractedDataS3Key();

        int newVersion = extractAndIncrementVersion(currentKey);

        String basePath = submissionId + "/" + documentId + "/";
        String versionFolder = "v" + newVersion;

        String fileName = fileMeta.getFileName() + ".json";
        String newExtractedKey = basePath + versionFolder + "/" + fileName;
        String diffKey = basePath + versionFolder + "/diff.json";
        String updatedAt = String.valueOf(Instant.now().getEpochSecond());

        JsonNode extractedNode = objectMapper.valueToTree(dataRequestDto.getExtractedDataJson());
        JsonNode diffNode = objectMapper.valueToTree(dataRequestDto.getDiffJson());

        s3FileService.uploadJsonToS3(newExtractedKey, extractedNode);
        s3FileService.uploadJsonToS3(diffKey, diffNode);

        repository.updateExtractedDataKey(submissionId, documentId, newExtractedKey, updatedBy, updatedAt);

        JsonNode wrappedDiff = wrapDiffWithUpdatedBy(diffNode, updatedBy, updatedAt);
        WorkflowLogRequestDto logRequest = WorkflowLogRequestDto.builder()
                .workflowInstanceId(dataRequestDto.getDocumentId())
                .nodeName("DOCUMENT_REVIEW")
                .status("IN_PROGRESS")
                .message("Document Updated")
                .requestPayload(extractedNode)
                .responsePayload(wrappedDiff)
                .build();

        workflowLogClient.logWorkflowEvent(logRequest);

//        try {
//            JsonNode extractedNodeForLog = objectMapper.readTree(
//                    objectMapper.writeValueAsString(dataRequestDto.getExtractedDataJson()));
//
//            JsonNode diffNodeForLog = objectMapper.readTree(
//                    objectMapper.writeValueAsString(dataRequestDto.getDiffJson()));
//
//            WorkflowLogRequestDto logRequest = WorkflowLogRequestDto.builder()
//                    .workflowInstanceId(dataRequestDto.getDocumentId())
//                    .nodeName("DOCUMENT_REVIEW")
//                    .status("IN_PROGRESS")
//                    .message("Document Ingested")
//                    .requestPayload(extractedNodeForLog)
//                    .responsePayload(diffNodeForLog)
//                    .build();
//
//            workflowLogClient.logWorkflowEvent(logRequest);
//
//        } catch (JsonProcessingException e) {
//            log.error("Failed to parse json for the workflow event", e);
//        }

        return submissionId;
    }

    private JsonNode wrapDiffWithUpdatedBy(JsonNode diffNode, String updatedBy, String updatedAt) {

        ObjectNode root = objectMapper.createObjectNode();

        root.put("updatedBy", updatedBy);
        root.put("updatedAt", updatedAt);
        root.set("diff", diffNode);

        return root;
    }

    private int extractAndIncrementVersion(String currentKey) {

        if (currentKey == null) return 0;

        String[] parts = currentKey.split("/");
        String versionPart = parts[2];

        int currentVersion = Integer.parseInt(versionPart.substring(1));

        return currentVersion + 1;
    }
}

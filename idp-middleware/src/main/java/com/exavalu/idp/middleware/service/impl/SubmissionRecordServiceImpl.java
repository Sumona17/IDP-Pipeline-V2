package com.exavalu.idp.middleware.service.impl;

import com.exavalu.idp.middleware.dto.*;
import com.exavalu.idp.middleware.repository.SubmissionRepository;
import com.exavalu.idp.middleware.service.EventBridgePublisherService;
import com.exavalu.idp.middleware.service.S3FileService;
import com.exavalu.idp.middleware.service.SubmissionRecordService;
import com.exavalu.idp.middleware.utility.JsonComparator;
import com.exavalu.idp.middleware.utility.JsonModificationService;
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
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SubmissionRecordServiceImpl implements SubmissionRecordService {

    private static final Logger log = LoggerFactory.getLogger(SubmissionRecordServiceImpl.class);

    private final SubmissionRepository repository;
    private final S3FileService s3FileService;
    private final WorkflowLogClient workflowLogClient;

    private final ObjectMapper objectMapper;
    private final EventBridgePublisherService publisherService;

    @Override
    public List<SubmissionSummaryResponseDto> fetchUsedRecords() {
        return repository.fetchPendingSubmissions();
    }

    @Override
    public List<SubmissionDocumentInfoResponseDto> fetchDocumentsBySubmissionId(String submissionId,
                                                                                boolean isApprovalWindow) {
        return repository.fetchDocumentsBySubmissionId(submissionId,isApprovalWindow);
    }

    @Override
    public ValidateDataInfoResponseDto getValidateData(ValidateDataRequestDto request) {

        ValidateDataInfoResponseDto dataInfo = new ValidateDataInfoResponseDto();
        dataInfo.setExtractedData(s3FileService.getJsonNodeFromS3Key(request.getExtractedDataKey()));
        dataInfo.setEncodedPdfData(s3FileService.getBase64FromS3Uri(request.getOriginalFileKey()));

        if(Boolean.TRUE.equals(request.getIsFinalSubmit())){
            repository.updateReviewInProgress(request.getSubmissionId(), request.getDocumentId());
        }

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
                .nodeName(Boolean.TRUE.equals(dataRequestDto.getIsFinalSubmit())
                          ? "DOCUMENT_REVIEW_APPROVAL" : "DOCUMENT_REVIEW")
                .status("IN_PROGRESS")
                .message("Document Updated")
                .requestPayload(extractedNode)
                .responsePayload(wrappedDiff)
                .build();

        workflowLogClient.logWorkflowEvent(logRequest);

        return submissionId;
    }

    @Override
    public String updateReviewCompletedStatus(UpdateExtractedDataRequestDto dataRequestDto, String updatedBy) {

        String submissionId = dataRequestDto.getSubmissionId();
        String documentId = dataRequestDto.getDocumentId();

        String updatedAt = String.valueOf(Instant.now().getEpochSecond());

        JsonNode extractedNode = objectMapper.valueToTree(dataRequestDto.getExtractedDataJson());
        JsonNode diffNode = objectMapper.valueToTree(dataRequestDto.getDiffJson());

        SubmissionFileMetaDto fileMeta = repository.getFileMeta(submissionId, documentId);
        String basePath = submissionId + "/" + documentId + "/";

        if (Boolean.TRUE.equals(dataRequestDto.getIsUpdated())) {

            String currentKey = fileMeta.getExtractedDataS3Key();
            int newVersion = extractAndIncrementVersion(currentKey);

//            String basePath = submissionId + "/" + documentId + "/";
            String versionFolder = "v" + newVersion;
            String fileName = fileMeta.getFileName() + ".json";

            String newExtractedKey = basePath + versionFolder + "/" + fileName;
            String diffKey = basePath + versionFolder + "/diff.json";

            s3FileService.uploadJsonToS3(newExtractedKey, extractedNode);
            s3FileService.uploadJsonToS3(diffKey, diffNode);

            repository.updateExtractedDataKey(
                    submissionId,
                    documentId,
                    newExtractedKey,
                    updatedBy,
                    updatedAt
            );
        }

        repository.updateReviewCompletedStatus(submissionId, documentId, updatedBy, updatedAt);

        JsonNode wrappedDiff = wrapDiffWithUpdatedBy(diffNode, updatedBy, updatedAt);

        WorkflowLogRequestDto logRequest = WorkflowLogRequestDto.builder()
                .workflowInstanceId(dataRequestDto.getDocumentId())
                .nodeName("DOCUMENT_REVIEW_APPROVAL")
                .status("COMPLETED")
                .message("Document Submitted")
                .requestPayload(objectMapper.createObjectNode())
                .responsePayload(wrappedDiff)
                .build();

        workflowLogClient.logWorkflowEvent(logRequest);

        IdpDocumentEventDTO event = IdpDocumentEventDTO.builder()
                .eventId(UUID.randomUUID().toString())
                .submittedBy(updatedBy)
                .submittedAt(Instant.now().toEpochMilli())
                .status("SUBMITTED")
                .s3Key(basePath+fileMeta.getFileName())
                .senderEmail("")
                .submissionId(submissionId)
                .documentId(documentId)
                .emailSubject("")
                .formType(resolveDocumentType(fileMeta.getFileName()))
                .build();

        publisherService.publishDocumentEvent(event);

        return submissionId;
    }

    @Override
    public String pendingForApprovalStatus(UpdateExtractedDataRequestDto dataRequestDto, String updatedBy) {

        String submissionId = dataRequestDto.getSubmissionId();
        String documentId = dataRequestDto.getDocumentId();

        String updatedAt = String.valueOf(Instant.now().getEpochSecond());

        JsonNode extractedNode = objectMapper.valueToTree(dataRequestDto.getExtractedDataJson());
        JsonNode diffNode = objectMapper.valueToTree(dataRequestDto.getDiffJson());

        if (Boolean.TRUE.equals(dataRequestDto.getIsUpdated())) {

            SubmissionFileMetaDto fileMeta = repository.getFileMeta(submissionId, documentId);

            String currentKey = fileMeta.getExtractedDataS3Key();
            int newVersion = extractAndIncrementVersion(currentKey);

            String basePath = submissionId + "/" + documentId + "/";
            String versionFolder = "v" + newVersion;
            String fileName = fileMeta.getFileName() + ".json";

            String newExtractedKey = basePath + versionFolder + "/" + fileName;
            String diffKey = basePath + versionFolder + "/diff.json";

            s3FileService.uploadJsonToS3(newExtractedKey, extractedNode);
            s3FileService.uploadJsonToS3(diffKey, diffNode);

            repository.updateExtractedDataKey(
                    submissionId,
                    documentId,
                    newExtractedKey,
                    updatedBy,
                    updatedAt
            );
        }

        repository.pendingForApprovalStatus(submissionId, documentId, updatedBy, updatedAt);
        JsonNode wrappedDiff = wrapDiffWithUpdatedBy(diffNode, updatedBy, updatedAt);

        WorkflowLogRequestDto logRequest = WorkflowLogRequestDto.builder()
                .workflowInstanceId(dataRequestDto.getDocumentId())
                .nodeName("DOCUMENT_REVIEW")
                .status("COMPLETED")
                .message("Document send for approval")
                .requestPayload(objectMapper.createObjectNode())
                .responsePayload(wrappedDiff)
                .build();

        workflowLogClient.logWorkflowEvent(logRequest);

        return submissionId;
    }

    @Override
    public String updateExtractionDataStatus(UpdateExtractedDataRequestDto dataRequestDto, String updatedBy) {
        String submissionId = dataRequestDto.getSubmissionId();
        String documentId = dataRequestDto.getDocumentId();

        String updatedAt = String.valueOf(Instant.now().getEpochSecond());

        repository.updateExtractionDataStatus(submissionId, documentId, updatedBy, updatedAt);

//        WorkflowLogRequestDto logRequest = WorkflowLogRequestDto.builder()
//                .workflowInstanceId(dataRequestDto.getDocumentId())
//                .nodeName("DOCUMENT_REVIEW")
//                .status("COMPLETED")
//                .message("Document Submitted")
//                .requestPayload(objectMapper.createObjectNode())
//                .responsePayload(objectMapper.createObjectNode())
//                .build();
//
//        workflowLogClient.logWorkflowEvent(logRequest);

        return submissionId;
    }

    @Override
    public ValidateSubmitDataInfoResponseDto getDifferenceData(ValidateDataRequestDto request) {

        ValidateSubmitDataInfoResponseDto dataInfo = new ValidateSubmitDataInfoResponseDto();

        String voPath = request.getExtractedDataKey().replaceAll("/v\\d+/", "/v0/");
        JsonNode originalJson = s3FileService.getRawFromS3Key(voPath);
        JsonNode updatedJson = s3FileService.getRawFromS3Key(request.getExtractedDataKey());

        List<JsonDiffDto> differences = JsonComparator.compare(originalJson, updatedJson);
        dataInfo.setDifferences(differences);

        return dataInfo;
    }

    @Override
    public ValidateDataInfoApproverResponseDto getValidateDataForApprover(ValidateDataRequestDto request) {

        ValidateDataInfoApproverResponseDto dataInfo = new ValidateDataInfoApproverResponseDto();

        String voPath = request.getExtractedDataKey().replaceAll("/v\\d+/", "/v0/");
        JsonNode originalJson = s3FileService.getRawFromS3Key(voPath);
        JsonNode updatedJson = s3FileService.getRawFromS3Key(request.getExtractedDataKey());

        List<JsonDiffDto> differences = JsonComparator.compare(originalJson, updatedJson);
        dataInfo.setDifferences(differences);

        dataInfo.setEncodedPdfData(s3FileService.getBase64FromS3Uri(request.getOriginalFileKey()));

        JsonNode result = updatedJson.deepCopy();
        JsonModificationService.markModifications(originalJson, result);
        ObjectNode headerInfo = buildHeaderInfo(request.getExtractedDataKey(), updatedJson, objectMapper);

        dataInfo.setExtractedData(buildResponse(headerInfo, result, objectMapper));

        return dataInfo;
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

    private ObjectNode buildHeaderInfo(String s3Key, JsonNode jsonNode, ObjectMapper objectMapper) {

        String submissionId = s3Key.split("/")[0];

        String fullFileName = s3Key.substring(s3Key.lastIndexOf("/") + 1);

        String documentName = fullFileName
                .replaceAll("\\.(pdf|txt|doc|docx)?\\.json$", "")
                .replaceAll("\\.json$", "");

        ObjectNode headerInfo = objectMapper.createObjectNode();
        headerInfo.put("submissionId", submissionId);
        headerInfo.put("documentName", documentName);

        if (jsonNode.has("documentType")) {
            headerInfo.put("documentType", jsonNode.get("documentType").asText());
        }

        return headerInfo;
    }

    private Object buildResponse(ObjectNode headerInfo, JsonNode data, ObjectMapper objectMapper) {

        ObjectNode rootNode = objectMapper.createObjectNode();
        rootNode.set("headerInfo", headerInfo);
        rootNode.set("data", data);

        try {
            return objectMapper.treeToValue(rootNode, Object.class);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to build response", e);
        }
    }

    private static String resolveDocumentType(String fileName) {

        if (fileName == null) {
            return null;
        }

        String name = fileName.toLowerCase();

        if (name.contains("140")) {
            return "Acord 140";
        } else if (name.contains("125")) {
            return "Acord 125";
        } else if (name.contains("loss") || name.contains("lossrun")) {
            return "Loss Run";
        }

        return "Unknown";
    }
}

package com.exavalu.idp.middleware.repository.impl;

import com.exavalu.idp.middleware.dto.SubmissionDocumentInfoResponseDto;
import com.exavalu.idp.middleware.dto.SubmissionSummaryResponseDto;
import com.exavalu.idp.middleware.repository.SubmissionRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static com.exavalu.idp.middleware.utility.FileSizeUtil.formatFileSize;


@Repository
@RequiredArgsConstructor
public class SubmissionRepositoryImpl implements SubmissionRepository {

    private static final Logger log = LoggerFactory.getLogger(SubmissionRepositoryImpl.class);

    private final DynamoDbClient dynamoDbClient;

    @Value("${aws.dynamodb.table-name}")
    private String tableName;

    @Override
    public List<SubmissionSummaryResponseDto> fetchPendingSubmissions() {

        log.info("Table name: {}", tableName);

        ScanRequest scanRequest = ScanRequest.builder()
                .tableName(tableName)
                .filterExpression("#st = :pending")
                .projectionExpression(
                        "submissionId, createdAt, incomingPath, senderEmail, #st")
                .expressionAttributeNames(Map.of(
                        "#st", "status"
                ))
                .expressionAttributeValues(Map.of(
                        ":pending", AttributeValue.fromS("PENDING")
                ))
                .build();

        return dynamoDbClient.scan(scanRequest)
                .items()
                .stream()
                .map(this::mapToSubmissionSummary)
                .collect(Collectors.toList());
    }

    @Override
    public List<SubmissionDocumentInfoResponseDto> fetchDocumentsBySubmissionId(String submissionId) {

        GetItemRequest request = GetItemRequest.builder()
                .tableName(tableName)
                .key(Map.of(
                        "submissionId", AttributeValue.fromS(submissionId)
                ))
                .projectionExpression("file_contains")
                .build();

        Map<String, AttributeValue> item =
                dynamoDbClient.getItem(request).item();

        if (item == null || !item.containsKey("file_contains")) {
            return Collections.emptyList();
        }

        return mapToSubmissionFileInfoList(item.get("file_contains"));
    }

    @Override
    public List<SubmissionSummaryResponseDto> fetchSubmissionsByIds(List<String> submissionIds) {

        if (submissionIds == null || submissionIds.isEmpty()) {
            return Collections.emptyList();
        }

        List<Map<String, AttributeValue>> keys = submissionIds.stream()
                .map(id -> Map.of(
                        "submissionId", AttributeValue.fromS(id)
                ))
                .collect(Collectors.toList());

        KeysAndAttributes keysAndAttributes = KeysAndAttributes.builder()
                .keys(keys)
                .projectionExpression(
                        "submissionId, createdAt, incomingPath, senderEmail, #st")
                .expressionAttributeNames(Map.of(
                        "#st", "status"
                ))
                .build();

        BatchGetItemRequest request = BatchGetItemRequest.builder()
                .requestItems(Map.of(
                        tableName, keysAndAttributes
                ))
                .build();

        Map<String, List<Map<String, AttributeValue>>> responses =
                dynamoDbClient.batchGetItem(request).responses();

        return responses.getOrDefault(tableName, Collections.emptyList())
                .stream()
                .map(this::mapToSubmissionSummary)
                .collect(Collectors.toList());
    }


    private SubmissionSummaryResponseDto mapToSubmissionSummary(
            Map<String, AttributeValue> item) {

        return SubmissionSummaryResponseDto.builder()
                .submissionId(getString(item, "submissionId"))
                .createdAt(getString(item, "createdAt"))
                .incomingPath(getString(item, "incomingPath"))
                .senderEmail(getString(item, "senderEmail"))
                .status(getString(item, "status"))
                .build();
    }

    private List<SubmissionDocumentInfoResponseDto> mapToSubmissionFileInfoList(
            AttributeValue fileContainsAttr) {

        return fileContainsAttr.l().stream()
                .map(attr -> {
                    Map<String, AttributeValue> m = attr.m();

                    return SubmissionDocumentInfoResponseDto.builder()
                            .documentId(getString(m, "documentId"))
                            .documentType(getString(m, "documentType"))
                            .fileName(getString(m, "fileName"))
                            .originalFileKey(getString(m, "s3Key"))
                            .extractedDataKey(getString(m, "extractedDataS3Key"))
                            .fileSize(formatFileSize((getValue(m, "fileSize"))))
                            .build();
                })
                .collect(Collectors.toList());
    }


    private String getString(Map<String, AttributeValue> item, String key) {
        AttributeValue val = item.get(key);
        return (val != null && val.s() != null) ? val.s() : "";
    }

    private String getValue(Map<String, AttributeValue> map, String key) {
        AttributeValue attr = map.get(key);

        if (attr == null) {
            return "";
        }

        if (attr.s() != null) {
            return attr.s();
        }

        if (attr.n() != null) {
            return attr.n();
        }

        return "";
    }

}

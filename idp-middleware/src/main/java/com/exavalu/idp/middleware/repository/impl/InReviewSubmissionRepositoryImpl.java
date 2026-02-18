package com.exavalu.idp.middleware.repository.impl;

import com.exavalu.idp.middleware.repository.InReviewSubmissionRepository;
import lombok.RequiredArgsConstructor;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.ScanRequest;
import software.amazon.awssdk.services.dynamodb.model.UpdateItemRequest;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;


@Repository
@RequiredArgsConstructor
public class InReviewSubmissionRepositoryImpl implements InReviewSubmissionRepository {

    private static final Logger log = LoggerFactory.getLogger(InReviewSubmissionRepositoryImpl.class);

    private final DynamoDbClient dynamoDbClient;

    @Value("${aws.dynamodb.submission-status-table}")
    private String submissionStatusTable;

    @Value("${aws.dynamodb.table-name}")
    private String submissionTable;

    @Override
    public List<String> fetchSubmissionIdsByUserName(String userName) {

        ScanRequest request = ScanRequest.builder()
                .tableName(submissionStatusTable)
                .filterExpression("#un = :username")
                .projectionExpression("submissionId")
                .expressionAttributeNames(Map.of(
                        "#un", "userName"
                ))
                .expressionAttributeValues(Map.of(
                        ":username", AttributeValue.fromS(userName)
                ))
                .build();

        return dynamoDbClient.scan(request)
                .items()
                .stream()
                .map(item -> item.get("submissionId").s())
                .collect(Collectors.toList());
    }

    @Override
    public void updateSubmissionStatus(
            String submissionId,
            String status,
            String userName,
            String eMail
    ) {

        Map<String, AttributeValue> key = Map.of(
                "submissionId", AttributeValue.fromS(submissionId)
        );

        UpdateItemRequest request = UpdateItemRequest.builder()
                .tableName(submissionStatusTable)
                .key(key)
                .updateExpression(
                        "SET #status = :status, #userName = :userName, #eMail = :eMail")
                .expressionAttributeNames(Map.of(
                        "#status", "status",
                        "#userName", "userName",
                        "#eMail", "eMail"
                ))
                .expressionAttributeValues(Map.of(
                        ":status", AttributeValue.fromS(status),
                        ":userName", AttributeValue.fromS(userName),
                        ":eMail", AttributeValue.fromS(eMail)
                ))
                .build();

        dynamoDbClient.updateItem(request);
    }

    @Override
    public void updateSubmissionTableStatus(
            String submissionId,
            String status
    ) {

        Map<String, AttributeValue> key = Map.of(
                "submissionId", AttributeValue.fromS(submissionId)
        );

        UpdateItemRequest request = UpdateItemRequest.builder()
                .tableName(submissionTable)
                .key(key)
                .updateExpression("SET #status = :status")
                .expressionAttributeNames(Map.of(
                        "#status", "status"
                ))
                .expressionAttributeValues(Map.of(
                        ":status", AttributeValue.fromS(status)
                ))
                .build();

        dynamoDbClient.updateItem(request);
    }
}

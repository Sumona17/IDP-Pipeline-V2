package com.exavalu.idp.middleware.service;

import java.io.IOException;
import java.io.InputStream;
import java.util.Base64;
import java.util.List;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import lombok.RequiredArgsConstructor;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Request;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Response;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import com.exavalu.idp.middleware.dto.S3FileDto;

@Service
@RequiredArgsConstructor
public class S3FileService {

    private final S3Client s3Client;

    @Autowired
    private ObjectMapper objectMapper;

    public List<S3FileDto> listFilesInFolder(String bucket, String submissionId) {

        ListObjectsV2Request request = ListObjectsV2Request.builder()
                .bucket(bucket)
                .prefix(submissionId != null ? submissionId : "")
//                .maxKeys(1000)
                .build();

        ListObjectsV2Response response = s3Client.listObjectsV2(request);

        return response.contents().stream()
                .map(obj -> new S3FileDto(
                        obj.key(),
                        obj.size(),
                        obj.lastModified() != null ? obj.lastModified().toString() : null
                ))
                .toList();
    }

    public void uploadFile(String bucketName, MultipartFile file, String folderName) {
        try {
            String key = folderName + "/" + file.getOriginalFilename();

            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .contentType(file.getContentType())
                    .build();

            s3Client.putObject(
                    putObjectRequest,
                    RequestBody.fromBytes(file.getBytes())
            );

        } catch (IOException e) {
            throw new RuntimeException("Failed to upload file to S3", e);
        }
    }

    public String getBase64FromS3Uri(String s3Uri) {
        try {

            GetObjectRequest request = GetObjectRequest.builder()
                    .bucket("idp-file-content")
                    .key(s3Uri)
                    .build();

            try (InputStream is = s3Client.getObject(request)) {
                return Base64.getEncoder()
                        .encodeToString(is.readAllBytes());
            }

        } catch (Exception e) {
            throw new IllegalStateException("Failed to convert S3 object to Base64", e);
        }
    }

    public Object getJsonNodeFromS3Key(String s3Key) {

        try {
            GetObjectRequest request = GetObjectRequest.builder()
                    .bucket("idp-output-json")
                    .key(s3Key)
                    .build();

            try (InputStream is = s3Client.getObject(request)) {

//                JsonNode node = objectMapper.readTree(is);

                JsonNode originalNode = objectMapper.readTree(is);

                String submissionId = s3Key.split("/")[0];

                String fullFileName = s3Key.substring(s3Key.lastIndexOf("/") + 1);

                String documentName = fullFileName
                        .replaceAll("\\.(pdf|txt|doc|docx)?\\.json$", "")
                        .replaceAll("\\.json$", "");

                ObjectNode headerInfo = objectMapper.createObjectNode();
                headerInfo.put("submissionId", submissionId);
                headerInfo.put("documentName", documentName);

                ObjectNode rootNode = objectMapper.createObjectNode();
                rootNode.set("headerInfo", headerInfo);
                rootNode.set("data", originalNode);

                return objectMapper.treeToValue(rootNode, Object.class);

//                return objectMapper.treeToValue(node, Object.class);
            }

        } catch (Exception e) {
            throw new IllegalStateException("Failed to read JSON from S3", e);
        }
    }

    public void uploadJsonToS3(String key, JsonNode jsonNode) {

        s3Client.putObject(
                PutObjectRequest.builder()
                        .bucket("idp-output-json")
                        .key(key)
                        .contentType("application/json")
                        .build(),
                RequestBody.fromString(jsonNode.toString())
        );
    }

}

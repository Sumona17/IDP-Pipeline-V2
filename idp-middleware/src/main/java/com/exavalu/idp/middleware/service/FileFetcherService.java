package com.exavalu.idp.middleware.service;

import java.util.Base64;

import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import lombok.RequiredArgsConstructor;
import software.amazon.awssdk.core.ResponseBytes;

@Service
@RequiredArgsConstructor
public class FileFetcherService {
    private final S3Client s3Client;

    public String downloadFile(String bucket, String key) {
        GetObjectRequest request = GetObjectRequest.builder().bucket(bucket).key(key).build();
        ResponseBytes<GetObjectResponse> objectBytes = s3Client.getObjectAsBytes(request);

        byte[] fileBytes = objectBytes.asByteArray();
        return Base64.getEncoder().encodeToString(fileBytes);
    }
}
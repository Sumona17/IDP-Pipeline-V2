package com.exavalu.idp.middleware.service.impl;

import java.util.Base64;

import com.exavalu.idp.middleware.service.DocumentFetcherService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import lombok.RequiredArgsConstructor;
import software.amazon.awssdk.core.ResponseBytes;

@Service
@RequiredArgsConstructor
public class DocumentFetcherServiceImpl implements DocumentFetcherService {

    private static final Logger log = LoggerFactory.getLogger(DocumentFetcherServiceImpl.class);

    private static final String BUCKET_NAME = "idp-file-content";

    private final S3Client s3Client;

    @Override
    public String downloadFile(String key) {
        GetObjectRequest request = GetObjectRequest.builder().bucket(BUCKET_NAME).key(key).build();
        ResponseBytes<GetObjectResponse> objectBytes = s3Client.getObjectAsBytes(request);

        byte[] fileBytes = objectBytes.asByteArray();
        return Base64.getEncoder().encodeToString(fileBytes);
    }
}
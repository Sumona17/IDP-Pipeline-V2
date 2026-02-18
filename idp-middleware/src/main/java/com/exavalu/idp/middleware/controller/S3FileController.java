package com.exavalu.idp.middleware.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.exavalu.idp.middleware.dto.S3FileDto;
import com.exavalu.idp.middleware.service.S3FileService;
import org.springframework.beans.factory.annotation.Value;

import lombok.RequiredArgsConstructor;

import java.util.List;
import org.springframework.web.bind.annotation.PostMapping;

@RestController
@RequestMapping("/api/s3")
@RequiredArgsConstructor
public class S3FileController {

    @Value("${aws.bucketname}")
    private String bucketname;

    private final S3FileService s3FileService;

    /**
     * List all files in a folder
     * Example:
     * GET /api/s3/list?bucket=my-bucket&folder=folder1/
     */
    @GetMapping("/list")
    public ResponseEntity<List<S3FileDto>> listFiles(
            @RequestParam String submissionId) {
        List<S3FileDto> files = s3FileService.listFilesInFolder(bucketname, submissionId);
        return ResponseEntity.ok(files);
    }

    @PostMapping("/upload")
    public ResponseEntity<String> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("folder") String folderName, @AuthenticationPrincipal Jwt jwt) {
        s3FileService.uploadFile(bucketname, file, folderName);
        return ResponseEntity.ok("File uploaded successfully");
    }
}

package com.exavalu.idp.middleware.controller;

import com.exavalu.idp.middleware.dto.ApiResponseDto;
import com.exavalu.idp.middleware.service.DocumentFetcherService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/download")
@RequiredArgsConstructor
public class DocumentFetcherController {

    private final DocumentFetcherService documentFetcherService;

    @GetMapping("/fetchDocument")
    public ApiResponseDto<String> getRecordBySubmissionId(@RequestParam String filePrefix) {
        return ApiResponseDto.success(documentFetcherService.downloadFile(filePrefix), "Download completed");
    }
}

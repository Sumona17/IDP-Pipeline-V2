package com.exavalu.idp.middleware.controller;

import com.exavalu.idp.middleware.dto.ApiResponseDto;
import com.exavalu.idp.middleware.dto.IdpDocumentEventDTO;
import com.exavalu.idp.middleware.service.EventBridgePublisherService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/idp/event")
@RequiredArgsConstructor
public class IdpDocumentController {

    private final EventBridgePublisherService publisherService;

    @PostMapping("/submit")
    public ApiResponseDto<String> submitDocument(@RequestBody IdpDocumentEventDTO request) {

        IdpDocumentEventDTO event = IdpDocumentEventDTO.builder()
                .eventId(UUID.randomUUID().toString())
                .submittedBy(request.getSubmittedBy())
                .submittedAt(Instant.now().toEpochMilli())
                .status("SUBMITTED")
                .s3Key(request.getS3Key())
                .senderEmail(request.getSenderEmail())
                .submissionId(request.getSubmissionId())
                .emailSubject(request.getEmailSubject())
                .formType(request.getFormType())
                .headerInfo(request.getHeaderInfo())
                .data(request.getData())
                .build();

        publisherService.publishDocumentEvent(event);

        return ApiResponseDto.success("Document submitted and event published", "Event published");
    }
}
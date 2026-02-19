package com.exavalu.idp.middleware.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmissionDocumentInfoResponseDto {

    private String documentId;
    private String documentType;
    private String fileName;
    private String fileSize;
    private String fileProgress;
    private String status;
    private String createdAt;
    private String extractedDataKey;
    private String originalFileKey;
}

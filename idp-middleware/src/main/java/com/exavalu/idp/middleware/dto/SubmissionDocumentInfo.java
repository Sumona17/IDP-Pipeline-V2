package com.exavalu.idp.middleware.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmissionDocumentInfo {

    private String documentId;
    private String documentType;
    private String fileName;
    private String extractedDataKey;
    private String originalFileKey;
}

package com.exavalu.idp.middleware.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateExtractedDataRequestDto {
    private String submissionId;
    private String documentId;
    private Map<String, Object> extractedDataJson;
    private Object diffJson;
    private Boolean isUpdated;
    private Boolean isFinalSubmit;
}

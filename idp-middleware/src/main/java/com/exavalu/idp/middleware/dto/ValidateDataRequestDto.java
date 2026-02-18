package com.exavalu.idp.middleware.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ValidateDataRequestDto {

    private String submissionId;
    private String extractedDataKey;
    private String originalFileKey;
}

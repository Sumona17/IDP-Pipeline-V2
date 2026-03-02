package com.exavalu.idp.middleware.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ValidateDataRequestDto {

    @NonNull
    private String submissionId;

    @NotNull
    private String documentId;
    private String extractedDataKey;
    private String originalFileKey;
    private Boolean isFinalSubmit;
}

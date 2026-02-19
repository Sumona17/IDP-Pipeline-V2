package com.exavalu.idp.middleware.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmissionSummaryResponseDto {

    private String submissionId;
    private String createdAt;
    private String updatedAt;
    private String createdBy;
    private String documentSource;
    private String status;
}

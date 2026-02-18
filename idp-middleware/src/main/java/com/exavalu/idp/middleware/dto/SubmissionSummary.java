package com.exavalu.idp.middleware.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmissionSummary {

    private String submissionId;
    private String createdAt;
    private String incomingPath;
    private String senderEmail;
    private String status;
}

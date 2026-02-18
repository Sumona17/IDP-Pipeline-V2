package com.exavalu.idp.middleware.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InReviewSubmissionRequestDto {

    private String submissionId;
    private String status;
    private String userName;
    private String eMail;
}

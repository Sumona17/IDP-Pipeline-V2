package com.exavalu.idp.middleware.service;

import com.exavalu.idp.middleware.dto.InReviewSubmissionRequestDto;
import com.exavalu.idp.middleware.dto.SubmissionSummaryResponseDto;

import java.util.List;

public interface InReviewSubmissionService {

    List<SubmissionSummaryResponseDto> fetchMySubmissionList(String userName);
    void updateStatus(InReviewSubmissionRequestDto dto);
}

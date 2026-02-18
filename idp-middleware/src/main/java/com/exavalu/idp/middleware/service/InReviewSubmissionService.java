package com.exavalu.idp.middleware.service;

import com.exavalu.idp.middleware.dto.InReviewSubmissionDto;
import com.exavalu.idp.middleware.dto.SubmissionSummary;

import java.util.List;

public interface InReviewSubmissionService {

    List<SubmissionSummary> fetchMySubmissionList(String userName);
    void updateStatus(InReviewSubmissionDto dto);
}

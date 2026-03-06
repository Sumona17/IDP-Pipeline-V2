package com.exavalu.idp.middleware.service.impl;


import com.exavalu.idp.middleware.dto.InReviewSubmissionRequestDto;
import com.exavalu.idp.middleware.dto.SubmissionSummaryResponseDto;
import com.exavalu.idp.middleware.repository.InReviewSubmissionRepository;
import com.exavalu.idp.middleware.repository.SubmissionRepository;
import com.exavalu.idp.middleware.service.InReviewSubmissionService;
import lombok.RequiredArgsConstructor;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InReviewSubmissionServiceImpl implements InReviewSubmissionService {

    private static final Logger log = LoggerFactory.getLogger(InReviewSubmissionServiceImpl.class);

    private static final String STATUS = "Pending Review";

    private final InReviewSubmissionRepository inReviewRepository;
    private final SubmissionRepository submissionRepository;

    @Override
    public List<SubmissionSummaryResponseDto> fetchMySubmissionList(String userName) {

        List<String> submissionIds = inReviewRepository.fetchSubmissionIdsByUserName(userName);

        return submissionRepository.fetchSubmissionsByIds(submissionIds);
    }

    @Override
    public List<SubmissionSummaryResponseDto> fetchMyApprovalList(String userName) {

        return submissionRepository.fetchSubmissionsByStatus(List.of("Pending Approval", "Approved"));
    }

    @Override
    public void updateStatus(InReviewSubmissionRequestDto dto) {

        inReviewRepository.updateSubmissionStatus(dto.getSubmissionId(), STATUS, dto.getUserName(), dto.getEMail());

        inReviewRepository.updateSubmissionTableStatus(dto.getSubmissionId(), STATUS);
    }
}

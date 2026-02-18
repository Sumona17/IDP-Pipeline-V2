package com.exavalu.idp.middleware.service.impl;


import com.exavalu.idp.middleware.dto.InReviewSubmissionDto;
import com.exavalu.idp.middleware.dto.SubmissionSummary;
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

    private final InReviewSubmissionRepository inReviewRepository;
    private final SubmissionRepository submissionRepository;

    @Override
    public List<SubmissionSummary> fetchMySubmissionList(String userName) {

        List<String> submissionIds =
                inReviewRepository.fetchSubmissionIdsByUserName(userName);

        return submissionRepository.fetchSubmissionsByIds(submissionIds);
    }

    @Override
    public void updateStatus(InReviewSubmissionDto dto) {

        inReviewRepository.updateSubmissionStatus(
                dto.getSubmissionId(),
                dto.getStatus(),
                dto.getUserName(),
                dto.getEMail()
        );

        inReviewRepository.updateSubmissionTableStatus(dto.getSubmissionId(), dto.getStatus());
    }
}

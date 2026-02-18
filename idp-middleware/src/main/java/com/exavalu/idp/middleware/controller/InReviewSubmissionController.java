package com.exavalu.idp.middleware.controller;

import com.exavalu.idp.middleware.dto.InReviewSubmissionDto;
import com.exavalu.idp.middleware.dto.SubmissionSummary;
import com.exavalu.idp.middleware.service.InReviewSubmissionService;
import lombok.RequiredArgsConstructor;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/inreviewsubmissions")
@RequiredArgsConstructor
public class InReviewSubmissionController {

    private final InReviewSubmissionService InReviewSubmissionService;

    @GetMapping("/mySubmissionList")
    public List<SubmissionSummary> getAllRecords(@AuthenticationPrincipal Jwt jwt) {

        String username=jwt.getClaimAsString("username");
        return InReviewSubmissionService.fetchMySubmissionList(username);

    }

    @PostMapping("/updateStatus")
    public String updateStatus(@RequestBody InReviewSubmissionDto request, @AuthenticationPrincipal Jwt jwt) {

        String userName=jwt.getClaimAsString("username");
        request.setUserName(userName);

        InReviewSubmissionService.updateStatus(request);

        return "Status updated successfully for submissionId: "
                + request.getSubmissionId();
    }
}

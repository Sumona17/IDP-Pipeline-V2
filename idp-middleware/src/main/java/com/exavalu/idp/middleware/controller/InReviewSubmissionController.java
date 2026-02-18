package com.exavalu.idp.middleware.controller;

import com.exavalu.idp.middleware.dto.ApiResponseDto;
import com.exavalu.idp.middleware.dto.InReviewSubmissionRequestDto;
import com.exavalu.idp.middleware.dto.SubmissionSummaryResponseDto;
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
    public ApiResponseDto<List<SubmissionSummaryResponseDto>> getAllRecords(@AuthenticationPrincipal Jwt jwt) {

        String username=jwt.getClaimAsString("username");
        List<SubmissionSummaryResponseDto> records = InReviewSubmissionService.fetchMySubmissionList(username);

        return ApiResponseDto.success(records, "User submissions fetched successfully");

    }

    @PostMapping("/updateStatus")
    public ApiResponseDto<String> updateStatus(@RequestBody InReviewSubmissionRequestDto request, @AuthenticationPrincipal Jwt jwt) {

        String userName=jwt.getClaimAsString("username");
        request.setUserName(userName);

        InReviewSubmissionService.updateStatus(request);

        return ApiResponseDto.success("Status updated successfully for submissionId: "
                        + request.getSubmissionId(), "Update completed");
    }
}

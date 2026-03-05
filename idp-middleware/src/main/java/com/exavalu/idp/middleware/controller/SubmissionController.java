package com.exavalu.idp.middleware.controller;

import com.exavalu.idp.middleware.dto.*;
import com.exavalu.idp.middleware.exception.RecordNotFoundException;
import com.exavalu.idp.middleware.service.SubmissionRecordService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/submissions")
@RequiredArgsConstructor
public class SubmissionController {

    private final SubmissionRecordService service;
    private static final Logger logger = LoggerFactory.getLogger(SubmissionController.class);

    @GetMapping("/fetchAllSubmissions")
    public ApiResponseDto<List<SubmissionSummaryResponseDto>> getUsedRecords() {

        List<SubmissionSummaryResponseDto> records = service.fetchUsedRecords();

        return ApiResponseDto.success(records, "Submissions fetched successfully");
    }

    @GetMapping("/documents/{submissionId}")
    public ApiResponseDto<List<SubmissionDocumentInfoResponseDto>>
        getRecordBySubmissionId(@PathVariable String submissionId,
                                @RequestParam(name = "isApprovalWindow", required = false, defaultValue = "false")
                                boolean isApprovalWindow) {

        List<SubmissionDocumentInfoResponseDto> record = service.fetchDocumentsBySubmissionId(submissionId,
                                                                                              isApprovalWindow);

        if (record.isEmpty()) {
            throw new RecordNotFoundException(
                    "Submission not found for ID: " + submissionId
            );
        }

        return ApiResponseDto.success(record, "Submission documents fetched successfully");
    }

    @PostMapping("/getValidateData")
    public ApiResponseDto<ValidateDataInfoResponseDto> getValidateData(@RequestBody ValidateDataRequestDto request) {

        ValidateDataInfoResponseDto response = service.getValidateData(request);;

        return ApiResponseDto.success(response, "Validate data fetched successfully");
    }

    @PostMapping("/updateExtractedData")
    public ApiResponseDto<String> updateExtractedData(@RequestBody UpdateExtractedDataRequestDto request,
                                                      @AuthenticationPrincipal Jwt jwt) {

        String userName=jwt.getClaimAsString("username");
        service.updateExtractedDataVersion(request,userName);

        return ApiResponseDto.success("Data updated successfully for submissionId: "
                + request.getSubmissionId(), "Update completed");
    }

    @PostMapping("/submitExtractedData")
    public ApiResponseDto<String> submitExtractedData(@RequestBody UpdateExtractedDataRequestDto request,
                                                      @AuthenticationPrincipal Jwt jwt) {

        String userName=jwt.getClaimAsString("username");
        if(request.getIsFinalSubmit()){
            service.updateReviewCompletedStatus(request,userName);
        }else {
            service.pendingForApprovalStatus(request,userName);
        }

        return ApiResponseDto.success("Data updated successfully for submissionId: "
                + request.getSubmissionId(), "Update completed");
    }

    @PostMapping("/updateExtractionStatus")
    public ApiResponseDto<String> updateExtractionDataStatus(@RequestBody UpdateExtractedDataRequestDto request,
                                                             @AuthenticationPrincipal Jwt jwt) {

        String userName=jwt.getClaimAsString("username");
        service.updateExtractionDataStatus(request,userName);

        return ApiResponseDto.success("Data updated successfully for submissionId: "
                + request.getSubmissionId(), "Update completed");
    }

    @PostMapping("/getDifferenceData")
    public ApiResponseDto<ValidateSubmitDataInfoResponseDto> getDifferenceData(
            @RequestBody ValidateDataRequestDto request) {

        return ApiResponseDto.success(service.getDifferenceData(request), "Difference data fetched successfully");
    }


}

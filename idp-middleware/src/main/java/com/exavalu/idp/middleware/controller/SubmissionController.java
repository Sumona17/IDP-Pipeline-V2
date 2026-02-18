package com.exavalu.idp.middleware.controller;

import com.exavalu.idp.middleware.dto.*;
import com.exavalu.idp.middleware.exception.RecordNotFoundException;
import com.exavalu.idp.middleware.service.SubmissionRecordService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/submissions")
@RequiredArgsConstructor
public class SubmissionController {

    private final SubmissionRecordService service;
    private static final Logger logger = LoggerFactory.getLogger(SubmissionController.class);

    @GetMapping("/fetchAllSubmissions")
    public List<SubmissionSummary> getUsedRecords() {
        return service.fetchUsedRecords();
    }

    @GetMapping("/documents/{submissionId}")
    public List<SubmissionDocumentInfo> getRecordBySubmissionId(@PathVariable String submissionId) {
        List<SubmissionDocumentInfo> record = service.fetchDocumentsBySubmissionId(submissionId);
        if (record.isEmpty()) {
            throw new RecordNotFoundException("Submission not found for ID: " + submissionId);
        }
        return record;
    }

    @PostMapping("/getValidateData")
    public ValidateDataInfo getValidateData(@RequestBody ValidateDataRequestDto request) {

        return service.getValidateData(request);
    }


}

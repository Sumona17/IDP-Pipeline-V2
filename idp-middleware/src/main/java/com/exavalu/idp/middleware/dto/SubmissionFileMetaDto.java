package com.exavalu.idp.middleware.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class SubmissionFileMetaDto {
    private int index;
    private String extractedDataS3Key;
    private String fileName;
}
package com.exavalu.idp.middleware.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class S3FileDto {

    private String key;
    private long size;
    private String lastModified;
}

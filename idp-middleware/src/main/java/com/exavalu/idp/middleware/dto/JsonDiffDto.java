package com.exavalu.idp.middleware.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class JsonDiffDto {

    private String page;
    private String path;
    private Object originalValue;
    private Object newValue;

}
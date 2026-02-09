package com.workflowEngine.dto.workflowExecution;

import lombok.Getter;
import lombok.Setter;

import java.util.Map;

@Getter
@Setter
public class CompleteTaskRequest {

    private String instanceId;
    private String action;
    private Map<String, Object> data;
}

package com.workflowEngine.dto.workflowExecutionLog;

import lombok.Data;

@Data
public class LogNodeRequest {

    private String workflowInstanceId;

    private String nodeName;

    private String status;
    private String message;

    private Object requestPayload;
    private Object responsePayload;
}


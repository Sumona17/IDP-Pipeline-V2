package com.workflowEngine.dto.workflowExecutionLog;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class WorkflowExecutionLogResponse {

    private String id;
    private String workflowInstanceId;
    private String nodeId;
    private String nodeType;
    private String nodeName;
    private String status;
    private String message;
    private String requestPayload;
    private String responsePayload;
    private String executedAt;
    private String durationFormatted;



}


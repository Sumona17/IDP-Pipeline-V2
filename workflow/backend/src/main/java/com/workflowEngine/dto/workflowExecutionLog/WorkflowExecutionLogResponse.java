package com.workflowEngine.dto.workflowExecutionLog;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

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
    private LocalDateTime executedAt;
    private String durationFormatted;



}


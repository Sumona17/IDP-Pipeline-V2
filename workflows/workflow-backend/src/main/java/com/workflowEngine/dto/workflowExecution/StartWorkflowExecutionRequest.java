package com.workflowEngine.dto.workflowExecution;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class StartWorkflowExecutionRequest {

    private String workflowId;
    private String entityId;
}

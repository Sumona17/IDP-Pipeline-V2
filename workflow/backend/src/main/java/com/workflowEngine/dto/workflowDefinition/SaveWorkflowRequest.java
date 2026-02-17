package com.workflowEngine.dto.workflowDefinition;

import lombok.Data;

@Data
public class SaveWorkflowRequest {

    private String name;
    private String version;
    private String definitionJson;
}

package com.workflowEngine.engine;

import com.workflowEngine.model.WorkflowDefinition;
import com.workflowEngine.model.WorkflowInstance;

import java.util.Map;

public interface WorkflowEngine {

    WorkflowInstance execute(
            WorkflowDefinition def,
            WorkflowInstance instance,
            String workflowJson,
            Map<String, Object> input
    );
}

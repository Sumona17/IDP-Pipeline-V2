package com.workflowEngine.service;

import com.workflowEngine.dto.workflowDefinition.SaveWorkflowRequest;
import com.workflowEngine.model.WorkflowDefinition;

import java.util.List;

public interface WorkflowDefinitionService {

    WorkflowDefinition save(SaveWorkflowRequest request);

    WorkflowDefinition getById(String workflowId);

    List<WorkflowDefinition> getList();

    List<WorkflowDefinition> getPendingList();
}

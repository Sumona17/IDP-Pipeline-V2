package com.workflowEngine.service;

import com.workflowEngine.dto.workflowExecution.CompleteTaskRequest;
import com.workflowEngine.dto.workflowExecution.StartWorkflowExecutionRequest;
import com.workflowEngine.model.WorkflowInstance;

import java.util.List;

public interface WorkflowExecutionService {

    WorkflowInstance startWorkflow(StartWorkflowExecutionRequest request);
    WorkflowInstance completeTask(CompleteTaskRequest request);
    List<WorkflowInstance> getList();
    List<WorkflowInstance> getListByStatus(String status);
}

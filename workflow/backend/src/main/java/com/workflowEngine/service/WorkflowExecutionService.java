package com.workflowEngine.service;

import com.workflowEngine.dto.workflowExecution.WorkflowInstanceView;
import com.workflowEngine.dto.workflowExecutionLog.LogNodeRequest;
import com.workflowEngine.model.WorkflowInstance;

import java.util.List;

public interface WorkflowExecutionService {

    WorkflowInstance startWorkflow(String workflowId);
    WorkflowInstance logNodeExternal(LogNodeRequest request);
    List<WorkflowInstanceView> getList();
    List<WorkflowInstance> getListByStatus(String status);
}

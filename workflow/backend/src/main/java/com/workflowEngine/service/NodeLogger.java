package com.workflowEngine.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.workflowEngine.dto.workflowExecutionLog.WorkflowExecutionLogResponse;
import com.workflowEngine.model.WorkflowExecutionLog;
import com.workflowEngine.model.WorkflowInstance;

import java.util.List;
import java.util.Map;

public interface NodeLogger {

    void logNode(WorkflowInstance instance,
                 JsonNode node,
                 String status,
                 String message,
                 Object request,
                 Object response);

    List<WorkflowExecutionLogResponse> fetchLogsByInstance(String instanceId);
    List<String> fetchLogByNodeName(String instanceId, String nodeName );


}

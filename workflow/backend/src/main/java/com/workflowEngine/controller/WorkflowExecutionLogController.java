package com.workflowEngine.controller;

import com.workflowEngine.dto.workflowExecutionLog.WorkflowExecutionLogResponse;
import com.workflowEngine.model.WorkflowExecutionLog;
import com.workflowEngine.service.NodeLogger;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/workflow/logs")
@RequiredArgsConstructor
public class WorkflowExecutionLogController {
    private final NodeLogger service;


    @GetMapping("/{instanceId}")
    public List<WorkflowExecutionLogResponse> get(@PathVariable String instanceId) {
        return service.fetchLogsByInstance(instanceId);
    }

    @GetMapping("/fetchChangeLogs/{instanceId}")
    public List<String> getChangeLogs(@PathVariable String instanceId) {
        return service.fetchLogByNodeName(instanceId, "DOCUMENT_REVIEW");
    }
}

package com.workflowEngine.controller;

import com.workflowEngine.dto.workflowExecutionLog.WorkflowExecutionLogResponse;
import com.workflowEngine.service.NodeLogger;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/workflow/logs")
@RequiredArgsConstructor
public class WorkflowExecutionLogController {
    private final NodeLogger service;


    @GetMapping("/{instanceId}")
    public List<WorkflowExecutionLogResponse> get(@PathVariable String instanceId) {
        return service.fetchLogsByInstance(instanceId);
    }
}

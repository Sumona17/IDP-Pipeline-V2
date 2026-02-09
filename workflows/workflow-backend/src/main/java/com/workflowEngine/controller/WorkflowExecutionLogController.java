package com.workflowEngine.controller;

import com.workflowEngine.model.WorkflowDefinition;
import com.workflowEngine.model.WorkflowExecutionLog;
import com.workflowEngine.service.WorkflowDefinitionService;
import com.workflowEngine.service.WorkflowExecutionLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/workflow/logs")
@RequiredArgsConstructor
public class WorkflowExecutionLogController {
    private final WorkflowExecutionLogService service;


    @GetMapping("/{instanceId}")
    public List<WorkflowExecutionLog> get(@PathVariable String instanceId) {
        return service.fetchLogsByInstance(instanceId);
    }
}

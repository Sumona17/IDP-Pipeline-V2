package com.workflowEngine.controller;

import com.workflowEngine.dto.workflowDefinition.SaveWorkflowRequest;
import com.workflowEngine.model.WorkflowDefinition;
import com.workflowEngine.service.WorkflowDefinitionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/workflow")
@RequiredArgsConstructor
public class WorkflowDefinitionController {

    private final WorkflowDefinitionService service;

    @PostMapping("/save")
    public WorkflowDefinition save(@RequestBody SaveWorkflowRequest request) {
        return service.save(request);
    }

    @GetMapping("/{id}")
    public WorkflowDefinition get(@PathVariable String id) {
        return service.getById(id);
    }

    @GetMapping("/findAll")
    public List<WorkflowDefinition> get(){return service.getList();}

    @GetMapping("/findPending")
    public List<WorkflowDefinition> getPending(){return service.getPendingList();}




}

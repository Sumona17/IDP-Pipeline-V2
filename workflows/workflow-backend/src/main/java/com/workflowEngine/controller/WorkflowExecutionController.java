package com.workflowEngine.controller;

import com.workflowEngine.dto.workflowExecution.CompleteTaskRequest;
import com.workflowEngine.dto.workflowExecution.StartWorkflowExecutionRequest;
import com.workflowEngine.model.WorkflowDefinition;
import com.workflowEngine.model.WorkflowInstance;
import com.workflowEngine.service.WorkflowExecutionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/workflow")
@RequiredArgsConstructor
public class WorkflowExecutionController {

    private final WorkflowExecutionService workflowExecutionService;

    @PostMapping("/start")
    public WorkflowInstance start(@RequestBody StartWorkflowExecutionRequest request) {
        System.out.println("start service");
        return workflowExecutionService.startWorkflow(request);
    }

    @PostMapping("/complete")
    public WorkflowInstance complete(@RequestBody CompleteTaskRequest request) {
        return workflowExecutionService.completeTask(request);
    }

    @GetMapping("/findAllExecutions")
    public List<WorkflowInstance> getAll(){return workflowExecutionService.getList();}

    @PostMapping("/findExecutionsByStatus")
    public List<WorkflowInstance> getListByStatus(@RequestBody String status){return workflowExecutionService.getListByStatus(status);}
}

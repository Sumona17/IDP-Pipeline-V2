package com.workflowEngine.controller;


import com.workflowEngine.dto.workflowExecution.WorkflowInstanceView;
import com.workflowEngine.dto.workflowExecutionLog.LogNodeRequest;
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

    @GetMapping("/start/{workflowId}")
    public WorkflowInstance start(@PathVariable String workflowId) {
        return workflowExecutionService.startWorkflow(workflowId);
    }

    @GetMapping("/findAllExecutions")
    public List<WorkflowInstanceView> getAll(){return workflowExecutionService.getList();}

    @PostMapping("/findExecutionsByStatus")
    public List<WorkflowInstance> getListByStatus(@RequestBody String status){return workflowExecutionService.getListByStatus(status);}

    @PostMapping("/logNode")
    public WorkflowInstance logNode(@RequestBody LogNodeRequest request){
        return workflowExecutionService.logNodeExternal(request);
    }


}

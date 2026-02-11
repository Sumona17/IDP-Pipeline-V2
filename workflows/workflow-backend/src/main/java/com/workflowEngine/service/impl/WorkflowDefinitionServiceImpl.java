package com.workflowEngine.service.impl;

import com.workflowEngine.dto.workflowDefinition.SaveWorkflowRequest;
import com.workflowEngine.model.WorkflowDefinition;
import com.workflowEngine.repository.WorkflowDefinitionRepository;
import com.workflowEngine.service.WorkflowDefinitionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;


@Service
@RequiredArgsConstructor
public class WorkflowDefinitionServiceImpl implements WorkflowDefinitionService {

    private final WorkflowDefinitionRepository repository;

    @Override
    public WorkflowDefinition save(SaveWorkflowRequest request) {



        WorkflowDefinition def = new WorkflowDefinition();

        def.setId(UUID.randomUUID().toString());
        def.setName(request.getName());

        def.setVersion(request.getVersion());
        def.setDefinitionJson(request.getDefinitionJson());
        def.setCreatedAt(LocalDateTime.now());
        def.setUpdatedAt(LocalDateTime.now());
        def.setStatus("PENDING_EXECUTION");

        System.out.println("Workflow Request Status: "+def.getStatus());

        return repository.save(def);
    }

    @Override
    public WorkflowDefinition getById(String workflowId) {

        return repository.findById(workflowId)
                .orElseThrow(() -> new RuntimeException("Workflow not found"));
    }

    @Override
    public List<WorkflowDefinition> getList() {
        return repository.findAll();
    }

    public List<WorkflowDefinition> getPendingList() {
        return repository.findByStatus("PENDING_EXECUTION");
    }
}

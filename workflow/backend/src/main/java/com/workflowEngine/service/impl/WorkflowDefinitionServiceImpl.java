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
        def.setStatus("PENDING");

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
        return repository.findByStatus("PENDING");
    }

    @Override
    public WorkflowDefinition updateWorkflow(
            String workflowId,
            SaveWorkflowRequest request
    ){
        WorkflowDefinition existing = repository.findById(workflowId)
                .orElseThrow(() ->
                        new RuntimeException("Workflow not found: " + workflowId)
                );


        if ("In_PROGRESS".equals(existing.getStatus())) {
            throw new RuntimeException(
                    "Cannot update RUNNING workflow."
            );
        }


        if (request.getDefinitionJson() != null) {

            existing.setDefinitionJson(request.getDefinitionJson());

        }

        if (request.getName() != null) {
            existing.setName(request.getName());
        }

        if (request.getVersion() != null) {
            existing.setVersion(request.getVersion());
        }

        existing.setUpdatedAt(LocalDateTime.now());

        return repository.save(existing);

    }
}

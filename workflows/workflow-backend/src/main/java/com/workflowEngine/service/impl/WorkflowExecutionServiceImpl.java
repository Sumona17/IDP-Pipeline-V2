package com.workflowEngine.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.workflowEngine.dto.workflowExecution.CompleteTaskRequest;
import com.workflowEngine.dto.workflowExecution.StartWorkflowExecutionRequest;
import com.workflowEngine.engine.WorkflowEngine;
import com.workflowEngine.model.WorkflowDefinition;
import com.workflowEngine.model.WorkflowInstance;
import com.workflowEngine.repository.WorkflowDefinitionRepository;
import com.workflowEngine.repository.WorkflowInstanceRepository;
import com.workflowEngine.service.WorkflowExecutionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class WorkflowExecutionServiceImpl implements WorkflowExecutionService {

    private final WorkflowDefinitionRepository definitionRepo;
    private final WorkflowInstanceRepository instanceRepo;
    private final WorkflowEngine engine;
    private final ObjectMapper objectMapper;

    /* ===============================
       START WORKFLOW
    =============================== */
    @Override
    public WorkflowInstance startWorkflow(StartWorkflowExecutionRequest request) {

        System.out.println("StartWorkflowRequest:"+request);
        

        WorkflowDefinition def = definitionRepo
                .findById(request.getWorkflowId())
                .orElseThrow(() ->
                        new RuntimeException("Workflow definition not found"));


        System.out.println("Fetched WorkflowDefinition:"+def);
        def.setStatus("RUNNING_EXECUTION");
        definitionRepo.save(def);
        JsonNode workflowJson;
        try {
            workflowJson = objectMapper.readTree(def.getDefinitionJson());
        } catch (Exception e) {
            throw new RuntimeException("Invalid workflow JSON", e);
        }

        String startNodeId = extractStartNodeId(workflowJson);
            System.out.println("Workflow startId:"+ startNodeId);

        WorkflowInstance instance = new WorkflowInstance();
        instance.setId(UUID.randomUUID().toString());
        instance.setWorkflowId(def.getId());
        instance.setEntityId(request.getEntityId());
        instance.setStatus("IN_PROGRESS");
        instance.setStartedAt(LocalDateTime.now());
        instance.setCurrentNode(startNodeId);

        System.out.println("Workflow instance:"+ instance);

        WorkflowInstance updated = engine.execute(
                def,
                instance,
                def.getDefinitionJson(),
                new HashMap<>()
        );

        return instanceRepo.save(updated);
    }

    /* ===============================
       COMPLETE TASK / RESUME FLOW
    =============================== */
    @Override
    public WorkflowInstance completeTask(CompleteTaskRequest request) {

        WorkflowInstance instance = instanceRepo
                .findById(request.getInstanceId())
                .orElseThrow(() ->
                        new RuntimeException("Workflow instance not found"));

        WorkflowDefinition def = definitionRepo
                .findById(instance.getWorkflowId())
                .orElseThrow(() ->
                        new RuntimeException("Workflow definition not found"));


        WorkflowInstance updated = engine.execute(
                def,
                instance,
                def.getDefinitionJson(),
                request.getData()
        );

        return instanceRepo.save(updated);
    }

    /* ===============================
       HELPER: FIND START NODE
    =============================== */
    private String extractStartNodeId(JsonNode definitionJson) {

        JsonNode nodes = definitionJson.path("nodes");

        if (!nodes.isArray()) {
            throw new RuntimeException("Invalid workflow JSON: nodes missing");
        }

        Iterator<JsonNode> iterator = nodes.iterator();
        while (iterator.hasNext()) {
            JsonNode node = iterator.next();

            // Option 1: React Flow node type
            if ("start".equalsIgnoreCase(node.path("type").asText())) {
                return node.path("id").asText();
            }

            // Option 2: data.type == START
            if ("START".equalsIgnoreCase(node.path("data").path("type").asText())) {
                return node.path("id").asText();
            }
        }

        throw new RuntimeException("START node not found in workflow definition");
    }

    @Override
    public List<WorkflowInstance> getList() {
        return instanceRepo.findAll();
    }

    public List<WorkflowInstance> getListByStatus(String status) {
        return instanceRepo.findByStatus(status);
    }
}

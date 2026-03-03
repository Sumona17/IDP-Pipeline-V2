package com.workflowEngine.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.workflowEngine.dto.workflowExecution.WorkflowInstanceView;
import com.workflowEngine.dto.workflowExecutionLog.LogNodeRequest;
import com.workflowEngine.engine.WorkflowEngine;
import com.workflowEngine.model.WorkflowDefinition;
import com.workflowEngine.model.WorkflowExecutionLog;
import com.workflowEngine.model.WorkflowInstance;
import com.workflowEngine.repository.WorkflowDefinitionRepository;
import com.workflowEngine.repository.WorkflowExecutionLogRepository;
import com.workflowEngine.repository.WorkflowInstanceRepository;
import com.workflowEngine.service.WorkflowExecutionService;
import com.workflowEngine.utils.WorkflowDefinitionUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class WorkflowExecutionServiceImpl implements WorkflowExecutionService {

    private final WorkflowDefinitionRepository definitionRepo;
    private final WorkflowInstanceRepository instanceRepo;
    private final WorkflowEngine engine;
    private final ObjectMapper objectMapper;
    private final WorkflowExecutionLogRepository logRepo;


    @Override
    public WorkflowInstance startWorkflow(String workflowId) {

        WorkflowDefinition def = definitionRepo
                .findById(workflowId)
                .orElseThrow(() ->
                        new RuntimeException("Workflow definition not found"));
        def.setStatus("IN_PROGRESS");
        definitionRepo.save(def);
        JsonNode workflowJson;
        try {
            workflowJson = objectMapper.readTree(def.getDefinitionJson());
        } catch (Exception e) {
            throw new RuntimeException("Invalid workflow JSON", e);
        }

        String startNodeId = extractStartNodeId(workflowJson);

        WorkflowInstance instance = new WorkflowInstance();
        instance.setId(UUID.randomUUID().toString());
        instance.setWorkflowId(def.getId());
        instance.setEntityId("ENTITIY-");
        instance.setStatus("IN_PROGRESS");
        instance.setStartedAt(String.valueOf(Instant.now().getEpochSecond()));
        instance.setCurrentNode(startNodeId);
        instance.setCurrentNodeStatus("PENDING");
        instance.setCurrentNodeName("Start");

        WorkflowInstance updated = engine.execute(
                def,
                instance,
                def.getDefinitionJson(),
                new HashMap<>()
        );

        return instanceRepo.save(updated);
    }


    @Override
    public WorkflowInstance logNodeExternal(LogNodeRequest request) {

        WorkflowInstance instance = instanceRepo
                .findById(request.getWorkflowInstanceId())
                .orElseThrow(() ->
                        new IllegalArgumentException("Invalid workflow instance"));

        WorkflowDefinition def = definitionRepo
                .findById(instance.getWorkflowId())
                .orElseThrow(() ->
                        new RuntimeException("Workflow definition not found"));

        JsonNode definitionJson;
        try {
            definitionJson = objectMapper.readTree(def.getDefinitionJson());
        } catch (Exception e) {
            throw new RuntimeException("Invalid workflow JSON", e);
        }

        String nodeId;
        JsonNode node;

        node = WorkflowDefinitionUtils
                .findNodeByLabel(definitionJson, request.getNodeName())
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Node not found for name: " + request.getNodeName()
                        )
                );

        nodeId = node.get("id").asText();

        WorkflowExecutionLog log = new WorkflowExecutionLog();
        log.setWorkflowInstanceId(instance.getId());
        log.setNodeId(nodeId);
        log.setNodeName(request.getNodeName());
        log.setNodeType(node.get("type").asText());
        log.setStatus(request.getStatus());
        log.setMessage(request.getMessage());
        try{
            log.setRequestPayload(objectMapper.writeValueAsString(request.getRequestPayload()));
            log.setResponsePayload(objectMapper.writeValueAsString(request.getResponsePayload()));
        }catch (Exception e) {
            throw new RuntimeException("Invalid input", e);
        }
        log.setExecutedAt(String.valueOf(Instant.now().getEpochSecond()));

        logRepo.save(log);

        if ("COMPLETED".equals(request.getStatus())) {
            instance.setCurrentNodeStatus("COMPLETED");
            instance.setCurrentNodeName(request.getNodeName());
            instance.setStatus("IN_PROGRESS");
            instanceRepo.save(instance);

            engine.execute(
                    def,
                    instance,
                    def.getDefinitionJson(),
                    new HashMap<>()
            );
            return instance;
        }

        if ("IN_PROGRESS".equals(request.getStatus())) {
            instance.setCurrentNodeStatus("IN_PROGRESS");
            instance.setCurrentNodeName(request.getNodeName());
            instance.setStatus("WAITING");
            instanceRepo.save(instance);
            return instance;
        }

        if ("FAILED".equals(request.getStatus())) {
            instance.setCurrentNodeStatus("FAILED");
            instance.setCurrentNodeName(request.getNodeName());
            instance.setStatus("FAILED");
            instance.setCompletedAt(String.valueOf(Instant.now().getEpochSecond()));
            instanceRepo.save(instance);
            return instance;
        }
        return instance;
    }

    private String extractStartNodeId(JsonNode definitionJson) {

        JsonNode nodes = definitionJson.path("nodes");

        if (!nodes.isArray()) {
            throw new RuntimeException("Invalid workflow JSON: nodes missing");
        }

        Iterator<JsonNode> iterator = nodes.iterator();
        while (iterator.hasNext()) {
            JsonNode node = iterator.next();


            if ("start".equalsIgnoreCase(node.path("type").asText())) {
                return node.path("id").asText();
            }


            if ("START".equalsIgnoreCase(node.path("data").path("type").asText())) {
                return node.path("id").asText();
            }
        }

        throw new RuntimeException("START node not found in workflow definition");
    }

    @Override
    public List<WorkflowInstanceView> getList() {

        List<WorkflowInstanceView> instances =
                instanceRepo.findAllWithWorkflowName();

        return instances.stream().map(instance -> {

            if (instance.getStartedAt() != null) {

                long start = Long.parseLong(instance.getStartedAt());
                long end = Long.parseLong(instance.getCompletedAt() != null
                        ? instance.getCompletedAt()
                        : String.valueOf(Instant.now().getEpochSecond()));

                long seconds = end - start;

                long hours = seconds / 3600;
                long minutes = (seconds % 3600) / 60;
                long secs = seconds % 60;

                instance.setDurationFormatted(
                        (hours > 0 ? hours + "h" : "") +
                                (minutes > 0 ? minutes + "m" : "") +
                                secs + "s"
                );

            } else {
                instance.setDurationFormatted(null);
            }

            return instance;

        }).toList();
    }



    public List<WorkflowInstance> getListByStatus(String status) {
        return instanceRepo.findByStatus(status);
    }



}

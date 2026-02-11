package com.workflowEngine.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.workflowEngine.model.WorkflowExecutionLog;
import com.workflowEngine.model.WorkflowInstance;
import com.workflowEngine.repository.WorkflowExecutionLogRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class WorkflowExecutionLogService {

    private final ObjectMapper mapper;
    private final WorkflowExecutionLogRepository logRepo;

    public WorkflowExecutionLogService(WorkflowExecutionLogRepository logRepo, ObjectMapper mapper) {
        this.logRepo = logRepo;
        this.mapper=mapper;
    }

    public void logNode(
            WorkflowInstance instance,
            JsonNode node,
            String status,
            String message,
            Object request,
            Object response
    ) {
        WorkflowExecutionLog log = new WorkflowExecutionLog();
        log.setWorkflowInstanceId(instance.getId());
        log.setNodeId(node.get("id").asText());
        log.setNodeType(node.get("type").asText());
        log.setNodeName((node.get("data").get("label").asText()));
        log.setStatus(status);
        log.setMessage(message);
        log.setExecutedAt(LocalDateTime.now());

        try{

            if (request != null) {
                log.setRequestPayload(mapper.writeValueAsString(request));
            }
            if (response != null) {
                log.setResponsePayload(mapper.writeValueAsString(response));
            }

        }catch (JsonProcessingException e) {

            log.setMessage(message + " | Payload serialization failed");
        }

        logRepo.save(log);
    }

    public List<WorkflowExecutionLog> fetchLogsByInstance(String instanceId){
        return logRepo.findByWorkflowInstanceIdOrderByExecutedAtAsc(instanceId);
    }
}

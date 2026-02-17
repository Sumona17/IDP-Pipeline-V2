package com.workflowEngine.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.workflowEngine.dto.workflowExecutionLog.WorkflowExecutionLogResponse;
import com.workflowEngine.model.WorkflowExecutionLog;
import com.workflowEngine.model.WorkflowInstance;
import com.workflowEngine.repository.WorkflowExecutionLogRepository;
import com.workflowEngine.service.NodeLogger;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class WorkflowExecutionLogImpl implements NodeLogger {

    private final WorkflowExecutionLogRepository logRepo;
    private final ObjectMapper mapper;

    @Override
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

    @Override
    public List<WorkflowExecutionLogResponse> fetchLogsByInstance(String instanceId){

        List<WorkflowExecutionLog> logs =
                logRepo.findByWorkflowInstanceIdOrderByExecutedAtAsc(instanceId);

        Map<String, LocalDateTime> startTimes = new HashMap<>();
        List<WorkflowExecutionLogResponse> responseList = new ArrayList<>();

        for (WorkflowExecutionLog log : logs) {

            if ("start".equalsIgnoreCase(log.getNodeType())) {
                continue;
            }

            if ("end".equalsIgnoreCase(log.getNodeType())) {
                continue;
            }

            if ("WAITING".equalsIgnoreCase(log.getStatus())) {
                continue;
            }

            String nodeId = log.getNodeId();

            WorkflowExecutionLogResponse dto = new WorkflowExecutionLogResponse();

            dto.setId(log.getId());
            dto.setWorkflowInstanceId(log.getWorkflowInstanceId());
            dto.setNodeId(nodeId);
            dto.setNodeType(log.getNodeType());
            dto.setNodeName(log.getNodeName());
            dto.setStatus(log.getStatus());
            dto.setMessage(log.getMessage());
            dto.setRequestPayload(log.getRequestPayload());
            dto.setResponsePayload(log.getResponsePayload());
            dto.setExecutedAt(log.getExecutedAt());

            if ("STARTED".equals(log.getStatus())) {
                startTimes.put(nodeId, log.getExecutedAt());
                dto.setDurationFormatted(null);
            }

            if ("COMPLETED".equals(log.getStatus()) || "FAILED".equals(log.getStatus())) {

                LocalDateTime startTime = startTimes.get(nodeId);

                if (startTime != null) {

                    Duration d = Duration.between(startTime, log.getExecutedAt());

                    dto.setDurationFormatted(
                            (d.toHours() > 0 ? d.toHours() + "h" : "") +
                                    (d.toMinutesPart() > 0 ? d.toMinutesPart() + "m" : "") +
                                    d.toSecondsPart() + "s"
                    );
                }
            }

            responseList.add(dto);
        }

        return responseList;
    }



}

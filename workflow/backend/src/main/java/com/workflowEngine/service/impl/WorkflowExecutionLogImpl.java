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
import java.time.Instant;
import java.util.*;

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
        log.setExecutedAt(Instant.now().toEpochMilli());

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

        Map<String,Long> startTimes = new HashMap<>();
        List<WorkflowExecutionLogResponse> responseList = new ArrayList<>();

        WorkflowExecutionLog lastLog = logs.isEmpty() ? null : logs.get(logs.size() - 1);

        boolean lastNodeIsWaiting = lastLog != null &&
                "WAITING".equalsIgnoreCase(lastLog.getStatus());

        Map<String, List<String>> payloadHistory = new HashMap<>();

        for (WorkflowExecutionLog log : logs) {

            if ("start".equalsIgnoreCase(log.getNodeType())) {
                continue;
            }

            if ("end".equalsIgnoreCase(log.getNodeType())) {
                continue;
            }


            if ("WAITING".equalsIgnoreCase(log.getStatus())) {
                if (!lastNodeIsWaiting || !log.equals(lastLog)) {
                    continue;
                }
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

            payloadHistory.putIfAbsent(nodeId, new ArrayList<>());

            List<String> history = payloadHistory.get(nodeId);

            if (log.getResponsePayload() != null) {
                history.add(log.getResponsePayload());
            }

            String combinedPayload = String.join(",", history);


            dto.setResponsePayload(combinedPayload);
            dto.setExecutedAt(log.getExecutedAt());

            if ("STARTED".equals(log.getStatus())) {
                startTimes.put(nodeId, log.getExecutedAt());
                dto.setDurationFormatted(null);
            }

            if ("COMPLETED".equals(log.getStatus()) || "FAILED".equals(log.getStatus())) {

                Long startTimeStr = startTimes.get(nodeId);

                if (startTimeStr != null) {

                    long start = startTimeStr;
                    long end = log.getExecutedAt();

                    long seconds = (end - start)/1000;

                    long hours = seconds / 3600;
                    long minutes = (seconds % 3600) / 60;
                    long secs = seconds % 60;


                    dto.setDurationFormatted(
                            (hours > 0 ? hours + "h" : "") +
                                    (minutes > 0 ? minutes + "m" : "") +
                                    secs + "s"
                    );
                }
            }

            responseList.add(dto);
        }

        return responseList;
    }

    @Override
    public List<String> fetchLogByNodeName(String instanceId, String nodeName) {

        List<WorkflowExecutionLog> logs =
                logRepo.findByWorkflowInstanceIdAndNodeNameAndStatusInOrderByExecutedAtAsc(
                        instanceId,
                        nodeName,
                        List.of("IN_PROGRESS", "COMPLETED")
                );

        return logs.stream()
                .map(WorkflowExecutionLog::getResponsePayload)
                .filter(Objects::nonNull)
                .toList();
    }
}

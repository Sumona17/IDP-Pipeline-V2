package com.workflowEngine.engine;

import com.workflowEngine.model.WorkflowDefinition;
import com.workflowEngine.model.WorkflowInstance;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.workflowEngine.repository.WorkflowInstanceRepository;
import com.workflowEngine.service.ApiTaskService;
import com.workflowEngine.service.NodeLogger;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class WorkflowEngineImpl implements WorkflowEngine {

    private final ObjectMapper mapper = new ObjectMapper();
    private final ApiTaskService apiTaskService;
    private final NodeLogger logService;
    private final WorkflowInstanceRepository instanceRepository;

    public WorkflowEngineImpl(ApiTaskService apiTaskService, NodeLogger logService, WorkflowInstanceRepository instanceRepository) {
        this.apiTaskService = apiTaskService;
        this.logService= logService;
        this.instanceRepository= instanceRepository;
    }

    @Override
    public WorkflowInstance execute(
            WorkflowDefinition def,
            WorkflowInstance instance,
            String workflowJson,
            Map<String, Object> input
    ) {

        try {
            JsonNode root = mapper.readTree(workflowJson);
            int safetyCounter = 0;

            while(true){

                if (safetyCounter++ > 1000) {
                    instance.setStatus("FAILED");
                    return instance;
                }

                JsonNode currentNode = findNode(root, instance.getCurrentNode());
                if ("COMPLETED".equals(instance.getCurrentNodeStatus())) {
                    moveToNext(instance, root, currentNode, null);
                    instance.setCurrentNodeStatus("PENDING");
                    instance.setCurrentNodeName(currentNode.get("data").get("label").asText());
                    instanceRepository.save(instance);

                    continue;
                }

                if ("PENDING".equals(instance.getCurrentNodeStatus())) {

                    logService.logNode(instance, currentNode, "STARTED", "Task started", null, null);
                    instance.setCurrentNodeStatus("STARTED");
                    instance.setCurrentNodeName(currentNode.get("data").get("label").asText());
                    instance.setStatus("IN_PROGRESS");
                    instanceRepository.save(instance);
                }


                String type = currentNode.get("type").asText();

                try{
                    switch (type) {

                        case "start":
                            moveToNext(instance, root, currentNode, null);
                            instance.setCurrentNodeStatus("PENDING");
                            instance.setCurrentNodeName(currentNode.get("data").get("label").asText());
                            instanceRepository.save(instance);
                            break;


                        case "task":
                            executeTask(instance,currentNode, input);
                            if ("WAITING".equals(instance.getStatus())) {
                                return instance;
                            }
                            moveToNext(instance, root, currentNode, null);
                            break;

                        case "end":

                            instance.setStatus("COMPLETED");
                            def.setStatus("COMPLETED");
                            instance.setCompletedAt(java.time.LocalDateTime.now());
                            logService.logNode(
                                    instance,
                                    currentNode,
                                    "COMPLETED",
                                    "Workflow completed",null,null
                            );
                            return instance;

                        default:
                            throw new RuntimeException("Unsupported node type: " + type);
                    }

                    logService.logNode(
                            instance,
                            currentNode,
                            "COMPLETED",
                            "Node executed successfully",null,null
                    );

                }
                catch(Exception nodeError){
                    instance.setStatus("FAILED");
                    instance.setCompletedAt(java.time.LocalDateTime.now());
                    def.setStatus("FAILED");

                    logService.logNode(
                            instance,
                            currentNode,
                            "FAILED",
                            nodeError.getMessage(),null,null
                    );
                    return instance;
                }

            }


        } catch (Exception e) {

            throw new RuntimeException("Workflow execution failed", e);
        }
    }

    private JsonNode findNode(JsonNode root, String nodeId) {
        for (JsonNode node : root.get("nodes")) {
            if (node.get("id").asText().equals(nodeId)) {
                return node;
            }
        }
        throw new RuntimeException("Node not found: " + nodeId);
    }

    private WorkflowInstance moveToNext(
            WorkflowInstance instance,
            JsonNode root,
            JsonNode currentNode,
            String decisionLabel
    ) {

        String currentNodeId = currentNode.get("id").asText();

        for (JsonNode edge : root.get("edges")) {

            if (!edge.get("source").asText().equals(currentNodeId)) {
                continue;
            }

            if (decisionLabel != null) {
                String label = edge.has("label") ? edge.get("label").asText() : "";
                if (!decisionLabel.equals(label)) {
                    continue;
                }
            }

            instance.setCurrentNode(edge.get("target").asText());
            instance.setStatus("IN_PROGRESS");
            return instance;
        }

        throw new RuntimeException("No outgoing edge from node: " + currentNodeId);
    }


    private void executeTask(WorkflowInstance instance,JsonNode node, Map<String, Object> input) {

        JsonNode data = node.get("data");
        String function = data.has("function") ? data.get("function").asText() : "";
        String body= data.has("body")? data.get("boody").asText():"";
        String currentNodeName=data.get("label").asText();

        switch (function) {

            case "mail":
                sendMail(data);
                logService.logNode(
                        instance,
                        node,
                        "COMPLETED",
                        "Mail sent successfully",
                        data,
                        Map.of("status", "SENT")
                );

            break;

            case "api_call":

                callApi(instance,node,data, input, body);
                break;

            case "human_driven":

                logService.logNode(
                        instance,
                        node,
                        "WAITING",
                        "Waiting for human action",
                        Map.of(
                                "assignee", data.path("assignee").asText(),
                                "taskType", "",
                                "message", data.path("description").asText()
                        ),
                        null
                );

                instance.setStatus("WAITING");
                instance.setCurrentNodeStatus("WAITING");
                instance.setCurrentNodeName(currentNodeName);
                instanceRepository.save(instance);


                return;

            case "execute_lambda":

                logService.logNode(
                        instance,
                        node,
                        "WAITING",
                        "Waiting for the next action",
                        null,
                        null
                );
                instance.setStatus("WAITING");
                instance.setCurrentNodeStatus("WAITING");
                instance.setCurrentNodeName(currentNodeName);
                instanceRepository.save(instance);
                return;

            default:


        }
    }

    private void sendMail(JsonNode data) {

        String sender = data.path("sender").asText();
        String recipient = data.path("recipient").asText();
        String objective = data.path("objective").asText();



    }


    private void callApi(
            WorkflowInstance instance,
            JsonNode node,
            JsonNode data,
            Map<String, Object> input,
            String body
    ) {

        String method = data.path("method").asText("GET");
        String endpoint = data.path("endpoint").asText();

        Map<String, Object> request = Map.of(
                "method", method,
                "endpoint", endpoint,
                "input", input
        );

        try {
            Object response = apiTaskService.callApi(
                    endpoint,
                    method,
                    input,
                    body
            );

            logService.logNode(
                    instance,
                    node,
                    "COMPLETED",
                    "API call successful",
                    request,
                    response
            );


            input.put(node.get("id").asText(), response);

        } catch (Exception ex) {

            logService.logNode(
                    instance,
                    node,
                    "FAILED",
                    "API call failed",
                    request,
                    Map.of("error", ex.getMessage())
            );

            throw ex;
        }
    }



}

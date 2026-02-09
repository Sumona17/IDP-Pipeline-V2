package com.workflowEngine.engine;

import com.workflowEngine.model.WorkflowDefinition;
import com.workflowEngine.model.WorkflowInstance;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.workflowEngine.service.ApiTaskService;
import com.workflowEngine.service.WorkflowDefinitionService;
import com.workflowEngine.service.WorkflowExecutionLogService;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class WorkflowEngine {

    private final ObjectMapper mapper = new ObjectMapper();
    private final ApiTaskService apiTaskService;
    private final WorkflowExecutionLogService logService;
    public WorkflowEngine(ApiTaskService apiTaskService, WorkflowExecutionLogService logService) {
        this.apiTaskService = apiTaskService;
        this.logService= logService;
    }

    /* ==============================
       MAIN EXECUTION METHOD
    ============================== */
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
                System.out.println("currentNode"+ currentNode);
                String type = currentNode.get("type").asText();
                logService.logNode(
                        instance,
                        currentNode,
                        "STARTED",
                        "Node execution started",
                        null,
                        null
                );

                try{
                    switch (type) {

                        case "start":
                            System.out.println("start node encountered,moving to next");
                            moveToNext(instance, root, currentNode, null);
                            break;


                        case "task":
                            System.out.println("got task node"+currentNode+input);
                            System.out.println("executing task");
                            executeTask(instance,currentNode, input);
                            System.out.println("moving to next from task node");
                            moveToNext(instance, root, currentNode, null);
                            break;

                        case "gateway":
                            String decision = evaluateGateway(currentNode, input);
                            moveToNext(instance, root, currentNode, decision);
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

    /* ==============================
       NODE FINDER
    ============================== */
    private JsonNode findNode(JsonNode root, String nodeId) {
        for (JsonNode node : root.get("nodes")) {
            if (node.get("id").asText().equals(nodeId)) {
                return node;
            }
        }
        throw new RuntimeException("Node not found: " + nodeId);
    }

    /* ==============================
       MOVE TO NEXT NODE (EDGE BASED)
    ============================== */
    private WorkflowInstance moveToNext(
            WorkflowInstance instance,
            JsonNode root,
            JsonNode currentNode,
            String decisionLabel
    ) {
        System.out.println("moveNext function");
        String currentNodeId = currentNode.get("id").asText();
        System.out.println("instance "+instance);
        System.out.println("root "+root);
        System.out.println("currentNode "+currentNode);
        System.out.println("decisionLabel "+decisionLabel);

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
            System.out.println("instance updated in movenext function");
            return instance;
        }

        throw new RuntimeException("No outgoing edge from node: " + currentNodeId);
    }

    /* ==============================
       TASK EXECUTION
    ============================== */
    private void executeTask(WorkflowInstance instance,JsonNode node, Map<String, Object> input) {

        JsonNode data = node.get("data");
        System.out.println("executing task with the node data"+data);
        String function = data.has("function") ? data.get("function").asText() : "";
        System.out.println("node function"+function);

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

                callApi(instance,node,data, input);
                break;

            default:

                System.out.println("ℹ️ No function defined for task");
        }
    }

    /* ==============================
       MAIL TASK
    ============================== */
    private void sendMail(JsonNode data) {

        String sender = data.path("sender").asText();
        String recipient = data.path("recipient").asText();
        String objective = data.path("objective").asText();

        System.out.println("📧 Sending mail");
        System.out.println("From: " + sender);
        System.out.println("To: " + recipient);
        System.out.println("Message: " + objective);

        // TODO: JavaMailSender
    }

    /* ==============================
       API TASK
    ============================== */
    private void callApi(
            WorkflowInstance instance,
            JsonNode node,
            JsonNode data,
            Map<String, Object> input
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
                    input
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



    /* ==============================
       GATEWAY DECISION
    ============================== */
    private String evaluateGateway(JsonNode node, Map<String, Object> input) {

        JsonNode rules = node.get("data").get("decisionRules");
        int v = Integer.parseInt(input.get("v").toString());

        for (JsonNode rule : rules) {

            String condition = rule.get("condition").asText();
            String output = rule.get("output").asText();

            if (condition.contains("<=") && v <= extractNumber(condition)) {
                return output;
            }

            if (condition.contains(">") && v > extractNumber(condition)) {
                return output;
            }
        }

        throw new RuntimeException("No matching gateway rule");
    }

    private int extractNumber(String condition) {
        return Integer.parseInt(condition.replaceAll("\\D+", ""));
    }
}

package com.exavalu.idp.middleware.dto;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class WorkflowLogRequestDto {

    private String workflowInstanceId;
    private String nodeName;
    private String status;
    private String message;

    private JsonNode requestPayload;
    private JsonNode responsePayload;
}

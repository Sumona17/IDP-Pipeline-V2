package com.exavalu.idp.middleware.service.impl;

import com.exavalu.idp.middleware.dto.WorkflowLogRequestDto;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
@RequiredArgsConstructor
public class WorkflowLogClient {

    private static final Logger log = LoggerFactory.getLogger(WorkflowLogClient.class);

    private final ObjectMapper objectMapper;

    private final RestTemplate restTemplate;

    @Value("${external.workflow.base-url}")
    private String baseUrl;

    public void logWorkflowEvent(WorkflowLogRequestDto request) {

        try {

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            String jsonBody = objectMapper.writeValueAsString(request);

            HttpEntity<String> entity = new HttpEntity<>(jsonBody, headers);

            restTemplate.postForEntity(baseUrl+"/api/workflow/logNode", entity, Void.class);

        } catch (Exception ex) {
            log.error("Failed to log workflow event", ex);
        }
    }
}
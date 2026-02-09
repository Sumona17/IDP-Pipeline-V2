package com.workflowEngine.service;

import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class ApiTaskService {

    private final RestTemplate restTemplate;

    public ApiTaskService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public Object callApi(
            String endpoint,
            String method,
            Map<String, Object> payload
    ) {

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<?> entity =
                payload != null
                        ? new HttpEntity<>(payload, headers)
                        : new HttpEntity<>(headers);

        if ("GET".equalsIgnoreCase(method)) {
            ResponseEntity<Object> response =
                    restTemplate.exchange(
                            endpoint,
                            HttpMethod.GET,
                            entity,
                            Object.class
                    );
            return response.getBody();
        }

        if ("POST".equalsIgnoreCase(method)) {
            ResponseEntity<Object> response =
                    restTemplate.exchange(
                            endpoint,
                            HttpMethod.POST,
                            entity,
                            Object.class
                    );
            return response.getBody();
        }

        if ("PUT".equalsIgnoreCase(method)) {
            ResponseEntity<Object> response =
                    restTemplate.exchange(
                            endpoint,
                            HttpMethod.PUT,
                            entity,
                            Object.class
                    );
            return response.getBody();
        }

        throw new RuntimeException("Unsupported HTTP method: " + method);
    }
}

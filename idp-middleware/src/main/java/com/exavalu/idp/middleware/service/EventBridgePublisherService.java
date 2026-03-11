package com.exavalu.idp.middleware.service;

import com.exavalu.idp.middleware.dto.IdpDocumentEventDTO;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.eventbridge.EventBridgeClient;
import software.amazon.awssdk.services.eventbridge.model.PutEventsRequest;
import software.amazon.awssdk.services.eventbridge.model.PutEventsRequestEntry;

@Service
@RequiredArgsConstructor
@Slf4j
public class EventBridgePublisherService {

    private final EventBridgeClient eventBridgeClient;
    private final ObjectMapper objectMapper;

    @Value("${aws.eventbridge.bus-name}")
    private String busName;

    @Value("${aws.eventbridge.source}")
    private String source;

    @Value("${aws.eventbridge.detail-type}")
    private String detailType;

    public void publishDocumentEvent(IdpDocumentEventDTO event) {

        try {
            String detailJson = objectMapper.writeValueAsString(event);

            PutEventsRequestEntry entry = PutEventsRequestEntry.builder()
                    .eventBusName(busName)
                    .source(source)
                    .detailType(detailType)
                    .detail(detailJson)
                    .build();

            PutEventsRequest request = PutEventsRequest.builder()
                    .entries(entry)
                    .build();

            eventBridgeClient.putEvents(request);

            log.info("Event successfully published");

        } catch (Exception e) {
            log.error("Failed to publish event", e);
            throw new RuntimeException(e);
        }
    }
}
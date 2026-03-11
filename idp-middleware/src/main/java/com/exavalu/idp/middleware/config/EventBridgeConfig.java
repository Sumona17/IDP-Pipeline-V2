package com.exavalu.idp.middleware.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.ProfileCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.eventbridge.EventBridgeClient;

@Configuration
public class EventBridgeConfig {

    @Value("${aws.region}")
    private String region;

    @Value("${aws.profile:default}")
    private String profile;

    @Bean
    public EventBridgeClient eventBridgeClient() {

        return EventBridgeClient.builder()
                .region(Region.of(region))
                .credentialsProvider(
                        ProfileCredentialsProvider.builder()
                                .profileName(profile)
                                .build()
                )
                .build();
    }
}
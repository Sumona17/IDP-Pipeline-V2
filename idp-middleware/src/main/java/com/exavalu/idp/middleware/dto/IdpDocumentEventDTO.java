package com.exavalu.idp.middleware.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IdpDocumentEventDTO {

    private String eventId;
    private String submittedBy;
    private Long submittedAt;
    private String status;

    private String s3Key;
    private String submissionId;
    private String emailSubject;
    private String senderEmail;
    private String formType;

    private HeaderInfo headerInfo;
    private DocumentData data;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HeaderInfo {
        private String submissionId;
        private String documentName;
        private String documentType;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DocumentData {
        private String documentType;

        private List<Map<String, Object>> sections;
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> getSection(int pageNumber, String sectionName) {
        if (data == null || data.getSections() == null) return null;
        return data.getSections().stream()
                .filter(page -> Integer.valueOf(pageNumber).equals(page.get("page")))
                .findFirst()
                .map(page -> (Map<String, Object>) page.get(sectionName))
                .orElse(null);
    }

    public Map<String, Object> getPage(int pageNumber) {
        if (data == null || data.getSections() == null) return null;
        return data.getSections().stream()
                .filter(page -> Integer.valueOf(pageNumber).equals(page.get("page")))
                .findFirst()
                .orElse(null);
    }

    @SuppressWarnings("unchecked")
    public Object getFieldValue(int pageNumber, String sectionName, String fieldName) {
        Map<String, Object> section = getSection(pageNumber, sectionName);
        if (section == null) return null;
        Object field = section.get(fieldName);
        if (field instanceof Map) {
            return ((Map<String, Object>) field).get("value");
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    public Double getConfidenceScore(int pageNumber, String sectionName, String fieldName) {
        Map<String, Object> section = getSection(pageNumber, sectionName);
        if (section == null) return null;
        Object field = section.get(fieldName);
        if (field instanceof Map) {
            Object score = ((Map<String, Object>) field).get("confidence_score");
            if (score instanceof Number) {
                return ((Number) score).doubleValue();
            }
        }
        return null;
    }
}
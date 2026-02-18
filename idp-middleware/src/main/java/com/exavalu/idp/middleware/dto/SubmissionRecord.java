package com.exavalu.idp.middleware.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SubmissionRecord {
    private String submissionId;
    private String status;
    private String createdAt;
    private String processedAt;
    private String senderEmail;
    private String emailSubject;
    private String acord125GeneralInfo_agencyCustomerId;
    private String acord125GeneralInfo_agencyName;
    private String acord125GeneralInfo_applicant_name;
    private String acord125GeneralInfo_applicant_businessPhone;
    private String acord125GeneralInfo_applicant_feinOrSsn;
    private String acord125GeneralInfo_applicant_glCode;
    private String acord125GeneralInfo_applicant_mailingAddress;
    private String acord125GeneralInfo_applicant_naics;
    private String acord125GeneralInfo_applicant_noOfMembers;
    private String acord125GeneralInfo_applicant_organizationType;
    private List<Object> acord125GeneralInfo_applicant_otherNamedInsureds;
    private String acord125GeneralInfo_applicant_sic;
    private String acord125GeneralInfo_applicant_website;
    private String acord125GeneralInfo_carrier;
    private String acord125GeneralInfo_companyName;
    private String acord125GeneralInfo_contactName;
    private String acord125GeneralInfo_contactEmail;
    private String acord125GeneralInfo_contactPhone;
    private String acord125GeneralInfo_date;
    private String acord125GeneralInfo_naicCode;
    private String acord125GeneralInfo_policyNumber;
    private String acord125GeneralInfo_producerName;
    private String acord140GeneralInfo_agencyCustomerId;
    private String acord140GeneralInfo_agencyName;
    private String acord140GeneralInfo_applicant;
    private String acord140GeneralInfo_carrier;
    private String acord140GeneralInfo_date;
    private String acord140GeneralInfo_policyNumber;
    private String limit;
    private List<String> linesOfBusiness;
    private String s3Bucket;
    private String s3KeyAcord125;
    private String s3KeyAcord140;
    private Map<String, Object> Acord125Info;
    private Map<String, Object> Acord140Info;
    private Map<String, Object> LossRunInfo;
    private Map<String, Object> validationAcord125;
    private Map<String, Object> validationAcord140;
}
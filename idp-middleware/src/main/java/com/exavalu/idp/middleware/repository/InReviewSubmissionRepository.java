package com.exavalu.idp.middleware.repository;

import java.util.List;

public interface InReviewSubmissionRepository {

    List<String> fetchSubmissionIdsByUserName(String userName);

    void updateSubmissionStatus(
            String submissionId,
            String status,
            String userName,
            String eMail
    );

    void updateSubmissionTableStatus(
            String submissionId,
            String status
    );
}

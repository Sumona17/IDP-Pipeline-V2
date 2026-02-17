package com.workflowEngine.repository;

import com.workflowEngine.model.WorkflowDefinition;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;



@Repository
public interface WorkflowDefinitionRepository
        extends JpaRepository<WorkflowDefinition, String> {



    List<WorkflowDefinition> findByStatus(String status);
}


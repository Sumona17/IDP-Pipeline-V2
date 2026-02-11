// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

export const API_ENDPOINTS = {
  // Health
  HEALTH: `${API_BASE_URL}/health/status`,

  // Auth
  AUTH_SIGNUP: `${API_BASE_URL}/auth/signup`,
  AUTH_LOGIN: `${API_BASE_URL}/auth/login`,

  // Workflows (Not yet implemented in Spring Boot backend)
  WORKFLOWS: `${API_BASE_URL}/workflows`,
  WORKFLOW_BY_ID: (id: string) => `${API_BASE_URL}/workflows/${id}`,

  // Executions (Not yet implemented in Spring Boot backend)
  EXECUTIONS: `${API_BASE_URL}/executions`,
  EXECUTION_BY_ID: (id: string) => `${API_BASE_URL}/executions/${id}`,
  EXECUTION_START: (id: string) => `${API_BASE_URL}/executions/start/${id}`,
  EXECUTION_RESUME: (id: string) => `${API_BASE_URL}/executions/${id}/resume`,
};

export default API_ENDPOINTS;

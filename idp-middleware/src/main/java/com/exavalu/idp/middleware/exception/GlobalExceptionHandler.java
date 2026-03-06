package com.exavalu.idp.middleware.exception;

import com.exavalu.idp.middleware.dto.ApiResponseDto;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.List;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger log = LogManager.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponseDto<Object>> handleValidation(MethodArgumentNotValidException ex) {

        log.warn("Validation error: {}", ex.getMessage());

        List<String> errors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .collect(Collectors.toList());

        ApiResponseDto<Object> response =
                ApiResponseDto.failure("Validation failed", errors);

        return ResponseEntity.badRequest().body(response);
    }


    @ExceptionHandler(RecordNotFoundException.class)
    public ResponseEntity<ApiResponseDto<Object>> handleRecordNotFound(RecordNotFoundException ex) {

        log.warn("Record not found: {}", ex.getMessage());

        ApiResponseDto<Object> response =
                ApiResponseDto.failure(ex.getMessage(), null);

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    @ExceptionHandler(UnauthorizedAccessException.class)
    public ResponseEntity<ApiResponseDto<Object>> handleUnauthorized(UnauthorizedAccessException ex) {
        log.warn("Unauthorized access:: {}", ex.getMessage());
        ApiResponseDto<Object> response = ApiResponseDto.failure(ex.getMessage(), null);

        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponseDto<Object>> handleAll(Exception ex) {

        log.error("Unexpected error: ", ex);

        ApiResponseDto<Object> response =
                ApiResponseDto.failure(
                        "Something went wrong. Please try again later.",
                        null
                );

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}

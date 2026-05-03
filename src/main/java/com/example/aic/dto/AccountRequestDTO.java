package com.example.aic.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class AccountRequestDTO {
    private Long id;
    private String lastName;
    private String firstName;
    private String email;
    private String phone;
    private String institution;
    private String projectDetails;
    private String projectPeriod;
    private String requestedRole;
    private String status;
    private LocalDateTime createdAt;
}

package com.example.aic.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SignupRequest {
    @NotBlank
    @Size(min = 3, max = 50)
    private String username;

    @Email
    private String email;

    private String firstName;
    private String lastName;
    private String phone;

    @NotBlank
    private String role;

    @NotBlank
    @Size(min = 3, max = 40)
    private String password;
}

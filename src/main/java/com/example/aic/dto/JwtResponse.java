package com.example.aic.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class JwtResponse {
    private String accessToken;
    private String type = "Bearer";
    private Integer id;
    private String username;
    private String email;
    private List<String> roles;
    private boolean mustChangePassword;

    public JwtResponse(String accessToken, Integer id, String username, String email, List<String> roles, boolean mustChangePassword) {
        this.accessToken = accessToken;
        this.id = id;
        this.username = username;
        this.email = email;
        this.roles = roles;
        this.mustChangePassword = mustChangePassword;
    }
}

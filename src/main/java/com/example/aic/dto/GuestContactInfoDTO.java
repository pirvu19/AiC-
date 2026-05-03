package com.example.aic.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GuestContactInfoDTO {
    private Integer id;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
}

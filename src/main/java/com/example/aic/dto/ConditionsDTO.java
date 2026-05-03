package com.example.aic.dto;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class ConditionsDTO {
    private Integer id;
    private String status;
    private String title;
    private LocalDate date;
    private Integer regionId;
    private String regionName;
    private Integer massifId;
    private String massifName;
    private String description;
    private Double temperature;
    private Integer windSpeed;
    private String windDirection;
    private String visibility;
    private Integer snowDepth;
    private List<String> imageUrls;
    private Integer visitorId;
    private GuestContactInfoDTO guestContactInfo;
    private LocalDateTime createdAt;
}

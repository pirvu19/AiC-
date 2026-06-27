package com.example.aic.dto;

import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class AvalancheDTO {
    private Integer id;
    private String title;
    private LocalDate date;
    private Double latitude;
    private Double longitude;
    private String zone;
    private String size;
    private String safetyEquipment;
    private String link;
    private Integer massifId;
    private Integer typeId;
    private Integer causeId;
    private String status;
    private String massifName;
    private String typeName;
    private String causeName;
    private String orientationName;
    private Integer visitorId;
    private String eventTime;
    private String activity;
    private Integer orientationId;
    private TechnicalDetailsDTO technicalDetails;
    private DamagesAndVictimsDTO damagesAndVictims;
    private GuestContactInfoDTO guestContactInfo;
    private List<String> imageUrls;
}

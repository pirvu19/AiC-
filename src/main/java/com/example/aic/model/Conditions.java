package com.example.aic.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "conditions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Conditions {
    public enum Status {
        PENDING, VALIDATED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Converter(autoApply = true)
    public static class StatusConverter implements AttributeConverter<Status, String> {
        @Override
        public String convertToDatabaseColumn(Status status) {
            if (status == null) return null;
            if (status == Status.VALIDATED) return "approved";
            return status.name().toLowerCase();
        }

        @Override
        public Status convertToEntityAttribute(String dbData) {
            if (dbData == null) return null;
            if ("approved".equalsIgnoreCase(dbData)) return Status.VALIDATED;
            try {
                return Status.valueOf(dbData.toUpperCase());
            } catch (IllegalArgumentException e) {
                return Status.PENDING;
            }
        }
    }

    @Convert(converter = StatusConverter.class)
    private Status status;

    private String title;
    private LocalDate date;

    @ManyToOne
    @JoinColumn(name = "region_id")
    private Region region;

    @ManyToOne
    @JoinColumn(name = "massif_id")
    private Massif massif;

    @Column(columnDefinition = "TEXT")
    private String description;

    private Double temperature;
    private Integer windSpeed;
    private String windDirection;
    private String visibility;
    private Integer snowDepth;

    @OneToMany(mappedBy = "conditions", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ConditionImage> images = new ArrayList<>();

    @ManyToOne
    @JoinColumn(name = "visitor_id")
    @OnDelete(action = OnDeleteAction.SET_NULL)
    private User visitor;

    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "guest_contact_info_id")
    private GuestContactInfo guestContactInfo;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}

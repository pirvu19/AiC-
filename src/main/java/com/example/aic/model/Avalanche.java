package com.example.aic.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Entity
@Table(name = "avalanche")
@Data
public class Avalanche {

    public enum Status {
        PENDING, VALIDATED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false)
    private String title;

    private LocalDate date;

    private Double latitude;
    private Double longitude;

    private String zone;
    private String size;

    @Column(name = "safety_equipment")
    private String safetyEquipment;

    @Column(columnDefinition = "TEXT")
    private String link;

    @ManyToOne
    @JoinColumn(name = "massif_id")
    private Massif massif;

    @ManyToOne
    @JoinColumn(name = "type_id")
    private AvalancheType type;

    @ManyToOne
    @JoinColumn(name = "cause_id")
    private AvalancheCause cause;

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

    @ManyToOne
    @JoinColumn(name = "visitor_id")
    @OnDelete(action = OnDeleteAction.SET_NULL)
    private User visitor;

    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "guest_contact_info_id")
    private GuestContactInfo guestContactInfo;

    @Column(name = "event_time")
    private String eventTime;

    private String activity;

    @ManyToOne
    @JoinColumn(name = "orientation_id")
    private Orientation orientation;

    @OneToMany(mappedBy = "avalanche", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    private List<TechnicalDetails> technicalDetailsList;

    @OneToMany(mappedBy = "avalanche", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    private List<DamagesAndVictims> damagesAndVictimsList;

    public TechnicalDetails getTechnicalDetails() {
        return (technicalDetailsList == null || technicalDetailsList.isEmpty()) ? null : technicalDetailsList.get(0);
    }

    public void setTechnicalDetails(TechnicalDetails technicalDetails) {
        if (this.technicalDetailsList == null)
            this.technicalDetailsList = new java.util.ArrayList<>();
        this.technicalDetailsList.clear();
        if (technicalDetails != null) {
            technicalDetails.setAvalanche(this);
            this.technicalDetailsList.add(technicalDetails);
        }
    }

    public DamagesAndVictims getDamagesAndVictims() {
        return (damagesAndVictimsList == null || damagesAndVictimsList.isEmpty()) ? null : damagesAndVictimsList.get(0);
    }

    public void setDamagesAndVictims(DamagesAndVictims damagesAndVictims) {
        if (this.damagesAndVictimsList == null)
            this.damagesAndVictimsList = new java.util.ArrayList<>();
        this.damagesAndVictimsList.clear();
        if (damagesAndVictims != null) {
            damagesAndVictims.setAvalanche(this);
            this.damagesAndVictimsList.add(damagesAndVictims);
        }
    }

    @OneToMany(mappedBy = "avalanche", cascade = CascadeType.ALL)
    private List<AvalancheImage> images;
}

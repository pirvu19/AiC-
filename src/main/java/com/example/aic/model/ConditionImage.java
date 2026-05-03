package com.example.aic.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "condition_images")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConditionImage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "conditions_id")
    private Conditions conditions;

    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;
}

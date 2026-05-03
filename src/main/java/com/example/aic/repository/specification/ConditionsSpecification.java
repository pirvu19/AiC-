package com.example.aic.repository.specification;

import com.example.aic.model.Conditions;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class ConditionsSpecification {

    public static Specification<Conditions> filterBy(
            String title, List<Integer> regionIds, List<Integer> massifIds,
            LocalDate startDate, LocalDate endDate,
            Double minTemperature, Double maxTemperature,
            Integer minWindSpeed, Integer maxWindSpeed,
            List<String> windDirections, List<String> visibilities,
            Integer minSnowDepth, Integer maxSnowDepth,
            Conditions.Status status) {

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (title != null && !title.isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("title")), "%" + title.toLowerCase() + "%"));
            }

            if (regionIds != null && !regionIds.isEmpty()) {
                predicates.add(root.get("region").get("id").in(regionIds));
            }

            if (massifIds != null && !massifIds.isEmpty()) {
                predicates.add(root.get("massif").get("id").in(massifIds));
            }

            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("date"), startDate));
            }

            if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("date"), endDate));
            }

            if (minTemperature != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("temperature"), minTemperature));
            }
            if (maxTemperature != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("temperature"), maxTemperature));
            }

            if (minWindSpeed != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("windSpeed"), minWindSpeed));
            }
            if (maxWindSpeed != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("windSpeed"), maxWindSpeed));
            }

            if (windDirections != null && !windDirections.isEmpty()) {
                predicates.add(root.get("windDirection").in(windDirections));
            }

            if (visibilities != null && !visibilities.isEmpty()) {
                predicates.add(root.get("visibility").in(visibilities));
            }

            if (minSnowDepth != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("snowDepth"), minSnowDepth));
            }
            if (maxSnowDepth != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("snowDepth"), maxSnowDepth));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}

package com.example.aic.repository.specification;

import com.example.aic.model.*;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class AvalancheSpecification {

    public static Specification<Avalanche> filterBy(
            String title, List<Integer> massifIds, List<Integer> regionIds, List<Integer> typeIds, List<Integer> causeIds,
            List<Integer> orientationIds, LocalDate startDate, LocalDate endDate,
            Integer minAltitude, Integer maxAltitude, Integer minSlope,
            Integer minTrackLength, Integer maxTrackLength,
            Integer minCrownDepth, Integer maxCrownDepth,
            Integer minCrownWidth, Integer maxCrownWidth,
            Integer minVerticalDrop, Integer maxVerticalDrop,
            String relativeSize, 
            Boolean hasCaught, Boolean hasPartially, Boolean hasFully, 
            Boolean hasInjured, Boolean hasKilled, Boolean hasMaterial,
            String status) {

        return (root, query, cb) -> {
            query.distinct(true);
            List<Predicate> predicates = new ArrayList<>();

            if (title != null && !title.isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("title")), "%" + title.toLowerCase() + "%"));
            }

            Join<Avalanche, Massif> massifJoin = null;
            if ((massifIds != null && !massifIds.isEmpty()) || (regionIds != null && !regionIds.isEmpty())) {
                massifJoin = root.join("massif", JoinType.LEFT);
                if (massifIds != null && !massifIds.isEmpty()) {
                    predicates.add(massifJoin.get("id").in(massifIds));
                }
                if (regionIds != null && !regionIds.isEmpty()) {
                    predicates.add(massifJoin.join("region", JoinType.LEFT).get("id").in(regionIds));
                }
            }

            if (typeIds != null && !typeIds.isEmpty()) {
                predicates.add(root.join("type", JoinType.LEFT).get("id").in(typeIds));
            }

            if (causeIds != null && !causeIds.isEmpty()) {
                predicates.add(root.join("cause", JoinType.LEFT).get("id").in(causeIds));
            }

            if (orientationIds != null && !orientationIds.isEmpty()) {
                predicates.add(root.join("orientation", JoinType.LEFT).get("id").in(orientationIds));
            }

            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("date"), startDate));
            }

            if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("date"), endDate));
            }

            if (status != null && !status.isEmpty()) {
                try {
                    predicates.add(cb.equal(root.get("status"), Avalanche.Status.valueOf(status.toUpperCase())));
                } catch (IllegalArgumentException ignored) {}
            }

            // Technical Details filters
            boolean hasTechFilter = (minAltitude != null && minAltitude > 0) || 
                                   (maxAltitude != null && maxAltitude < 3000) || 
                                   (minSlope != null && minSlope > 0) ||
                                   (minTrackLength != null) || (maxTrackLength != null) ||
                                   (minCrownDepth != null) || (maxCrownDepth != null) ||
                                   (minCrownWidth != null) || (maxCrownWidth != null) ||
                                   (minVerticalDrop != null) || (maxVerticalDrop != null) ||
                                   (relativeSize != null && !relativeSize.isEmpty());

            Join<Avalanche, TechnicalDetails> techJoin = null;
            if (hasTechFilter) {
                techJoin = root.join("technicalDetailsList", JoinType.LEFT);
                if (minAltitude != null && minAltitude > 0) predicates.add(cb.greaterThanOrEqualTo(techJoin.get("altitude"), minAltitude));
                if (maxAltitude != null && maxAltitude < 3000) predicates.add(cb.lessThanOrEqualTo(techJoin.get("altitude"), maxAltitude));
                if (minSlope != null && minSlope > 0) predicates.add(cb.greaterThanOrEqualTo(techJoin.get("slopeInterpolation"), minSlope));
                
                if (minTrackLength != null) predicates.add(cb.greaterThanOrEqualTo(techJoin.get("trackLength"), minTrackLength));
                if (maxTrackLength != null) predicates.add(cb.lessThanOrEqualTo(techJoin.get("trackLength"), maxTrackLength));
                
                if (minCrownDepth != null) predicates.add(cb.greaterThanOrEqualTo(techJoin.get("crownDepth"), minCrownDepth));
                if (maxCrownDepth != null) predicates.add(cb.lessThanOrEqualTo(techJoin.get("crownDepth"), maxCrownDepth));
                
                if (minCrownWidth != null) predicates.add(cb.greaterThanOrEqualTo(techJoin.get("crownWidth"), minCrownWidth));
                if (maxCrownWidth != null) predicates.add(cb.lessThanOrEqualTo(techJoin.get("crownWidth"), maxCrownWidth));
                
                if (minVerticalDrop != null) predicates.add(cb.greaterThanOrEqualTo(techJoin.get("verticalDrop"), minVerticalDrop));
                if (maxVerticalDrop != null) predicates.add(cb.lessThanOrEqualTo(techJoin.get("verticalDrop"), maxVerticalDrop));
            }

            if (relativeSize != null && !relativeSize.isEmpty()) {
                Predicate p1 = cb.equal(root.get("size"), relativeSize);
                if (techJoin != null) {
                    Predicate p2 = cb.equal(techJoin.get("relativeSize"), relativeSize);
                    predicates.add(cb.or(p1, p2));
                } else {
                    predicates.add(p1);
                }
            }

            // Damages and Victims filters
            boolean hasDamageFilter = (hasCaught != null && hasCaught) || (hasPartially != null && hasPartially) || 
                                     (hasFully != null && hasFully) || (hasInjured != null && hasInjured) || 
                                     (hasKilled != null && hasKilled) || (hasMaterial != null && hasMaterial);

            if (hasDamageFilter) {
                Join<Avalanche, DamagesAndVictims> victimsJoin = root.join("damagesAndVictimsList", JoinType.LEFT);
                if (hasCaught != null && hasCaught) predicates.add(cb.greaterThan(victimsJoin.get("personsCaught"), 0));
                if (hasPartially != null && hasPartially) predicates.add(cb.greaterThan(victimsJoin.get("personsPartially"), 0));
                if (hasFully != null && hasFully) predicates.add(cb.greaterThan(victimsJoin.get("personsFully"), 0));
                if (hasInjured != null && hasInjured) predicates.add(cb.greaterThan(victimsJoin.get("personsInjured"), 0));
                if (hasKilled != null && hasKilled) predicates.add(cb.greaterThan(victimsJoin.get("personsKilled"), 0));
                if (hasMaterial != null && hasMaterial) predicates.add(cb.greaterThan(victimsJoin.get("materialDamage"), 0));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}

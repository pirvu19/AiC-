package com.example.aic.controller;

import com.example.aic.model.*;
import com.example.aic.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/metadata")
public class MetadataController {

    @Autowired
    private MassifRepository massifRepository;

    @Autowired
    private AvalancheTypeRepository typeRepository;

    @Autowired
    private AvalancheCauseRepository causeRepository;

    @Autowired
    private OrientationRepository orientationRepository;

    @Autowired
    private RegionRepository regionRepository;

    // --- Massifs ---
    @GetMapping("/massifs")
    public List<Massif> getMassifs() {
        return massifRepository.findAll();
    }

    @PostMapping("/massifs")
    @PreAuthorize("hasAnyRole('ADMIN', 'DATA_ENGINEER')")
    public Massif createMassif(@RequestBody Massif massif) {
        return massifRepository.save(massif);
    }

    @PutMapping("/massifs/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DATA_ENGINEER')")
    public Massif updateMassif(@PathVariable Integer id, @RequestBody Massif details) {
        Massif massif = massifRepository.findById(id).orElseThrow();
        massif.setName(details.getName());
        massif.setRegion(details.getRegion());
        return massifRepository.save(massif);
    }

    @DeleteMapping("/massifs/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DATA_ENGINEER')")
    public void deleteMassif(@PathVariable Integer id) {
        massifRepository.deleteById(id);
    }

    // --- Regions ---
    @GetMapping("/regions")
    public List<Region> getRegions() {
        return regionRepository.findAll();
    }

    @PostMapping("/regions")
    @PreAuthorize("hasAnyRole('ADMIN', 'DATA_ENGINEER')")
    public Region createRegion(@RequestBody Region region) {
        return regionRepository.save(region);
    }

    @PutMapping("/regions/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DATA_ENGINEER')")
    public Region updateRegion(@PathVariable Integer id, @RequestBody Region details) {
        Region region = regionRepository.findById(id).orElseThrow();
        region.setName(details.getName());
        return regionRepository.save(region);
    }

    @DeleteMapping("/regions/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DATA_ENGINEER')")
    public void deleteRegion(@PathVariable Integer id) {
        regionRepository.deleteById(id);
    }

    // --- Types ---
    @GetMapping("/types")
    public List<AvalancheType> getTypes() {
        return typeRepository.findAll();
    }

    @PostMapping("/types")
    @PreAuthorize("hasAnyRole('ADMIN', 'DATA_ENGINEER')")
    public AvalancheType createType(@RequestBody AvalancheType type) {
        return typeRepository.save(type);
    }

    @PutMapping("/types/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DATA_ENGINEER')")
    public AvalancheType updateType(@PathVariable Integer id, @RequestBody AvalancheType details) {
        AvalancheType type = typeRepository.findById(id).orElseThrow();
        type.setName(details.getName());
        return typeRepository.save(type);
    }

    @DeleteMapping("/types/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DATA_ENGINEER')")
    public void deleteType(@PathVariable Integer id) {
        typeRepository.deleteById(id);
    }

    // --- Causes ---
    @GetMapping("/causes")
    public List<AvalancheCause> getCauses() {
        return causeRepository.findAll();
    }

    @PostMapping("/causes")
    @PreAuthorize("hasAnyRole('ADMIN', 'DATA_ENGINEER')")
    public AvalancheCause createCause(@RequestBody AvalancheCause cause) {
        return causeRepository.save(cause);
    }

    @PutMapping("/causes/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DATA_ENGINEER')")
    public AvalancheCause updateCause(@PathVariable Integer id, @RequestBody AvalancheCause details) {
        AvalancheCause cause = causeRepository.findById(id).orElseThrow();
        cause.setDescription(details.getDescription());
        return causeRepository.save(cause);
    }

    @DeleteMapping("/causes/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DATA_ENGINEER')")
    public void deleteCause(@PathVariable Integer id) {
        causeRepository.deleteById(id);
    }

    // --- Orientations ---
    @GetMapping("/orientations")
    public List<Orientation> getOrientations() {
        return orientationRepository.findAll();
    }

    @PostMapping("/orientations")
    @PreAuthorize("hasAnyRole('ADMIN', 'DATA_ENGINEER')")
    public Orientation createOrientation(@RequestBody Orientation orientation) {
        return orientationRepository.save(orientation);
    }

    @PutMapping("/orientations/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DATA_ENGINEER')")
    public Orientation updateOrientation(@PathVariable Integer id, @RequestBody Orientation details) {
        Orientation orientation = orientationRepository.findById(id).orElseThrow();
        orientation.setDirection(details.getDirection());
        return orientationRepository.save(orientation);
    }

    @DeleteMapping("/orientations/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DATA_ENGINEER')")
    public void deleteOrientation(@PathVariable Integer id) {
        orientationRepository.deleteById(id);
    }
}

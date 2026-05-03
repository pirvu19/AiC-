package com.example.aic.controller;

import com.example.aic.dto.AvalancheDTO;
import com.example.aic.model.User;
import com.example.aic.repository.UserRepository;
import com.example.aic.service.AvalancheService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/avalanches")
public class AvalancheController {

    @Autowired
    private AvalancheService avalancheService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    @GetMapping
    public Page<AvalancheDTO> getAll(Pageable pageable) {
        return avalancheService.getAllAvalanches(pageable);
    }

    @GetMapping("/validated")
    public Page<AvalancheDTO> getValidated(Pageable pageable) {
        return avalancheService.getValidatedAvalanches(pageable);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AvalancheDTO> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(avalancheService.getAvalancheById(id));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<AvalancheDTO>> search(
            @RequestParam(required = false) String title,
            @RequestParam(required = false) List<Integer> massifId,
            @RequestParam(required = false) List<Integer> regionId,
            @RequestParam(required = false) List<Integer> typeId,
            @RequestParam(required = false) List<Integer> causeId,
            @RequestParam(required = false) List<Integer> orientationId,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(required = false) Integer minAltitude,
            @RequestParam(required = false) Integer maxAltitude,
            @RequestParam(required = false) Integer minSlope,
            @RequestParam(required = false) Integer minTrackLength,
            @RequestParam(required = false) Integer maxTrackLength,
            @RequestParam(required = false) Integer minCrownDepth,
            @RequestParam(required = false) Integer maxCrownDepth,
            @RequestParam(required = false) Integer minCrownWidth,
            @RequestParam(required = false) Integer maxCrownWidth,
            @RequestParam(required = false) Integer minVerticalDrop,
            @RequestParam(required = false) Integer maxVerticalDrop,
            @RequestParam(required = false) String relativeSize,
            @RequestParam(required = false) Boolean hasCaught,
            @RequestParam(required = false) Boolean hasPartially,
            @RequestParam(required = false) Boolean hasFully,
            @RequestParam(required = false) Boolean hasInjured,
            @RequestParam(required = false) Boolean hasKilled,
            @RequestParam(required = false) Boolean hasMaterial,
            @RequestParam(required = false) String status,
            Pageable pageable) {
        return ResponseEntity.ok(avalancheService.search(title, massifId, regionId, typeId, causeId, orientationId,
                startDate, endDate, minAltitude, maxAltitude, minSlope,
                minTrackLength, maxTrackLength, minCrownDepth, maxCrownDepth,
                minCrownWidth, maxCrownWidth, minVerticalDrop, maxVerticalDrop,
                relativeSize, hasCaught, hasPartially, hasFully, hasInjured, hasKilled, hasMaterial,
                status, pageable));
    }

    @Autowired
    private com.example.aic.service.ExportService exportService;

    @GetMapping("/export")
    public ResponseEntity<byte[]> export(
            @RequestParam(required = false) String title,
            @RequestParam(required = false) List<Integer> massifId,
            @RequestParam(required = false) List<Integer> regionId,
            @RequestParam(required = false) List<Integer> typeId,
            @RequestParam(required = false) List<Integer> causeId,
            @RequestParam(required = false) List<Integer> orientationId,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(required = false) Integer minAltitude,
            @RequestParam(required = false) Integer maxAltitude,
            @RequestParam(required = false) Integer minSlope,
            @RequestParam(required = false) Integer minTrackLength,
            @RequestParam(required = false) Integer maxTrackLength,
            @RequestParam(required = false) Integer minCrownDepth,
            @RequestParam(required = false) Integer maxCrownDepth,
            @RequestParam(required = false) Integer minCrownWidth,
            @RequestParam(required = false) Integer maxCrownWidth,
            @RequestParam(required = false) Integer minVerticalDrop,
            @RequestParam(required = false) Integer maxVerticalDrop,
            @RequestParam(required = false) String relativeSize,
            @RequestParam(required = false) Boolean hasCaught,
            @RequestParam(required = false) Boolean hasPartially,
            @RequestParam(required = false) Boolean hasFully,
            @RequestParam(required = false) Boolean hasInjured,
            @RequestParam(required = false) Boolean hasKilled,
            @RequestParam(required = false) Boolean hasMaterial,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "json") String format) throws java.io.IOException {
        
        List<AvalancheDTO> data = avalancheService.searchAll(title, massifId, regionId, typeId, causeId, orientationId,
                startDate, endDate, minAltitude, maxAltitude, minSlope,
                minTrackLength, maxTrackLength, minCrownDepth, maxCrownDepth,
                minCrownWidth, maxCrownWidth, minVerticalDrop, maxVerticalDrop,
                relativeSize, hasCaught, hasPartially, hasFully, hasInjured, hasKilled, hasMaterial,
                status);
        
        byte[] exportData = exportService.export(data, format, AvalancheDTO.class);
        
        String filename = "avalanches_" + LocalDate.now() + "." + format.toLowerCase();
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.setContentType(org.springframework.http.MediaType.APPLICATION_OCTET_STREAM);
        headers.setContentDispositionFormData("attachment", filename);
        
        return new ResponseEntity<>(exportData, headers, org.springframework.http.HttpStatus.OK);
    }

    @PostMapping
    public ResponseEntity<AvalancheDTO> create(@RequestBody AvalancheDTO dto) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = null;
        if (username != null && !"anonymousUser".equals(username)) {
            user = userRepository.findByUsername(username).orElse(null);
        }
        return ResponseEntity.ok(avalancheService.createAvalanche(dto, user));
    }
    
    @PostMapping(value = "/multipart", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AvalancheDTO> createWithImages(
            @RequestPart("avalanche") String avalancheJson,
            @RequestPart(value = "files", required = false) org.springframework.web.multipart.MultipartFile[] files)
            throws com.fasterxml.jackson.core.JsonProcessingException {

        AvalancheDTO dto = objectMapper.readValue(avalancheJson, AvalancheDTO.class);
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = null;
        if (username != null && !"anonymousUser".equals(username)) {
            user = userRepository.findByUsername(username).orElse(null);
        }

        return ResponseEntity.ok(avalancheService.createWithImages(dto, files, user));
    }

    @PutMapping("/{id}/validate")
    @PreAuthorize("hasAnyRole('ADMIN', 'EXPERT', 'REVIEWER')")
    public ResponseEntity<AvalancheDTO> validate(@PathVariable Integer id) {
        return ResponseEntity.ok(avalancheService.validateAvalanche(id));
    }

    @PostMapping("/{id}/images")
    @PreAuthorize("hasAnyRole('ADMIN', 'EXPERT', 'USER')")
    public ResponseEntity<List<com.example.aic.model.AvalancheImage>> uploadImages(
            @PathVariable Integer id,
            @RequestParam("files") org.springframework.web.multipart.MultipartFile[] files) {
        return ResponseEntity.ok(avalancheService.uploadImages(id, files));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'EXPERT', 'REVIEWER')")
    public ResponseEntity<AvalancheDTO> update(@PathVariable Integer id, @RequestBody AvalancheDTO dto) {
        return ResponseEntity.ok(avalancheService.updateAvalanche(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DATA_ENGINEER')")
    public ResponseEntity<?> delete(@PathVariable Integer id) {
        avalancheService.deleteAvalanche(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}/images")
    @PreAuthorize("hasAnyRole('ADMIN', 'DATA_ENGINEER')")
    public ResponseEntity<?> deleteImageByUrl(@PathVariable Integer id, @RequestParam String imageUrl) {
        avalancheService.deleteImageByUrl(id, imageUrl);
        return ResponseEntity.ok().build();
    }
}

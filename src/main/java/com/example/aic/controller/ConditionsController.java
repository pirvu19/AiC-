package com.example.aic.controller;

import com.example.aic.dto.ConditionsDTO;
import com.example.aic.model.User;
import com.example.aic.repository.UserRepository;
import com.example.aic.service.ConditionsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

@RestController
@RequestMapping("/api/conditions")
public class ConditionsController {

    @Autowired
    private ConditionsService conditionsService;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public Page<ConditionsDTO> getAll(Pageable pageable) {
        return conditionsService.getAllConditions(pageable);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ConditionsDTO> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(conditionsService.getConditionsById(id));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<ConditionsDTO>> search(
            @RequestParam(required = false) String title,
            @RequestParam(required = false) List<Integer> regionId,
            @RequestParam(required = false) List<Integer> massifId,
            @RequestParam(required = false) java.time.LocalDate startDate,
            @RequestParam(required = false) java.time.LocalDate endDate,
            @RequestParam(required = false) Double minTemperature,
            @RequestParam(required = false) Double maxTemperature,
            @RequestParam(required = false) Integer minWindSpeed,
            @RequestParam(required = false) Integer maxWindSpeed,
            @RequestParam(required = false) List<String> windDirection,
            @RequestParam(required = false) List<String> visibility,
            @RequestParam(required = false) Integer minSnowDepth,
            @RequestParam(required = false) Integer maxSnowDepth,
            Pageable pageable) {
        return ResponseEntity.ok(conditionsService.search(title, regionId, massifId, startDate, endDate, 
                minTemperature, maxTemperature, minWindSpeed, maxWindSpeed, 
                windDirection, visibility, minSnowDepth, maxSnowDepth, pageable));
    }

    @Autowired
    private com.example.aic.service.ExportService exportService;

    @GetMapping("/export")
    public ResponseEntity<byte[]> export(
            @RequestParam(required = false) String title,
            @RequestParam(required = false) List<Integer> regionId,
            @RequestParam(required = false) List<Integer> massifId,
            @RequestParam(required = false) java.time.LocalDate startDate,
            @RequestParam(required = false) java.time.LocalDate endDate,
            @RequestParam(required = false) Double minTemperature,
            @RequestParam(required = false) Double maxTemperature,
            @RequestParam(required = false) Integer minWindSpeed,
            @RequestParam(required = false) Integer maxWindSpeed,
            @RequestParam(required = false) List<String> windDirection,
            @RequestParam(required = false) List<String> visibility,
            @RequestParam(required = false) Integer minSnowDepth,
            @RequestParam(required = false) Integer maxSnowDepth,
            @RequestParam(defaultValue = "json") String format) throws java.io.IOException {
        
        List<ConditionsDTO> data = conditionsService.searchAll(title, regionId, massifId, startDate, endDate,
                minTemperature, maxTemperature, minWindSpeed, maxWindSpeed,
                windDirection, visibility, minSnowDepth, maxSnowDepth);
        
        byte[] exportData = exportService.export(data, format, ConditionsDTO.class);
        
        String filename = "conditions_" + java.time.LocalDate.now() + "." + format.toLowerCase();
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.setContentType(org.springframework.http.MediaType.APPLICATION_OCTET_STREAM);
        headers.setContentDispositionFormData("attachment", filename);
        
        return new ResponseEntity<>(exportData, headers, org.springframework.http.HttpStatus.OK);
    }

    @PostMapping
    public ResponseEntity<ConditionsDTO> create(@RequestBody ConditionsDTO dto) {
        org.springframework.security.core.Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String name = (auth != null) ? auth.getName() : null;
        User user = null;
        if (name != null && !"anonymousUser".equals(name)) {
            user = userRepository.findByEmail(name)
                    .orElseGet(() -> userRepository.findByUsername(name).orElse(null));
        }
        return ResponseEntity.ok(conditionsService.createConditions(dto, user));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('ADMIN', 'EXPERT')")
    public ResponseEntity<org.springframework.data.domain.Page<ConditionsDTO>> getPending(org.springframework.data.domain.Pageable pageable) {
        return ResponseEntity.ok(conditionsService.getPendingConditions(pageable));
    }

    @PostMapping("/{id}/validate")
    @PreAuthorize("hasAnyRole('ADMIN', 'EXPERT')")
    public ResponseEntity<Void> validate(@PathVariable Integer id) {
        conditionsService.validate(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping(value = "/multipart", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ConditionsDTO> createWithImages(
            @RequestPart("conditions") String conditionsJson,
            @RequestPart(value = "files", required = false) org.springframework.web.multipart.MultipartFile[] files)
            throws com.fasterxml.jackson.core.JsonProcessingException {

        ConditionsDTO dto = objectMapper.readValue(conditionsJson, ConditionsDTO.class);
        org.springframework.security.core.Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String name = (auth != null) ? auth.getName() : null;
        User user = null;
        if (name != null && !"anonymousUser".equals(name)) {
            user = userRepository.findByEmail(name)
                    .orElseGet(() -> userRepository.findByUsername(name).orElse(null));
        }

        return ResponseEntity.ok(conditionsService.createWithImages(dto, files, user));
    }

    @Autowired
    private com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('EXPERT') or hasRole('REVIEWER') or hasRole('ADMIN')")
    public ResponseEntity<ConditionsDTO> update(@PathVariable Integer id, @RequestBody ConditionsDTO dto) {
        return ResponseEntity.ok(conditionsService.updateConditions(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DATA_ENGINEER')")
    public ResponseEntity<?> delete(@PathVariable Integer id) {
        conditionsService.deleteConditions(id);
        return ResponseEntity.ok().build();
    }
}

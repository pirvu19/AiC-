package com.example.aic.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.example.aic.service.AvalancheSyncService;
import com.example.aic.service.AvalancheSyncService.SyncReport;

@RestController
@RequestMapping("/api/admin/sync")
public class AvalancheSyncController {

    private final AvalancheSyncService syncService;

    public AvalancheSyncController(AvalancheSyncService syncService) {
        this.syncService = syncService;
    }

    @PostMapping("/avalanches")
    @PreAuthorize("hasAnyRole('ADMIN', 'DATA_ENGINEER')")
    public ResponseEntity<SyncReport> syncAll() {
        SyncReport report = syncService.syncAll();
        return ResponseEntity.ok(report);
    }

    @PostMapping("/avalanches/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DATA_ENGINEER')")
    public ResponseEntity<SyncReport> syncOne(@PathVariable Integer id) {
        SyncReport report = syncService.syncOne(id);
        return ResponseEntity.ok(report);
    }
}

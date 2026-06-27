package com.example.aic.controller;

import com.example.aic.dto.AccountRequestDTO;
import com.example.aic.service.AccountRequestService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/account-requests")
public class AccountRequestController {
    private static final Logger logger = LoggerFactory.getLogger(AccountRequestController.class);

    @Autowired
    private AccountRequestService requestService;

    @PostMapping
    public ResponseEntity<?> submitRequest(@RequestBody AccountRequestDTO dto) {
        try {
            return ResponseEntity.ok(requestService.submitRequest(dto));
        } catch (Exception e) {
            logger.error("Error in submitRequest controller: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ADMIN_UTILIZATORI')")
    public ResponseEntity<?> getAllRequests() {
        try {
            logger.info("Admin fetching all account requests");
            return ResponseEntity.ok(requestService.getAllRequests());
        } catch (Exception e) {
            logger.error("Error in getAllRequests controller: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'ADMIN_UTILIZATORI')")
    public ResponseEntity<Void> approveRequest(@PathVariable Long id) {
        requestService.approveRequest(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN', 'ADMIN_UTILIZATORI')")
    public ResponseEntity<Void> rejectRequest(@PathVariable Long id) {
        requestService.rejectRequest(id);
        return ResponseEntity.ok().build();
    }
}

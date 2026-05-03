package com.example.aic.controller;

import com.example.aic.dto.JwtResponse;
import com.example.aic.dto.LoginRequest;
import com.example.aic.dto.MessageResponse;
import com.example.aic.dto.SignupRequest;
import com.example.aic.model.Role;
import com.example.aic.model.User;
import com.example.aic.model.Person;
import com.example.aic.repository.RoleRepository;
import com.example.aic.repository.UserRepository;
import com.example.aic.security.JwtUtils;
import com.example.aic.security.UserDetailsImpl;
import com.example.aic.security.PasswordValidator;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    UserRepository userRepository;

    @Autowired
    RoleRepository roleRepository;

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    JwtUtils jwtUtils;

    @Autowired
    private com.example.aic.service.PasswordResetService passwordResetService;

    @Autowired
    private com.example.aic.service.NotificationPublisher notificationPublisher;

    @PostMapping("/signin")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        List<String> roles = userDetails.getAuthorities().stream()
                .map(item -> item.getAuthority())
                .collect(Collectors.toList());

        return ResponseEntity.ok(new JwtResponse(jwt,
                userDetails.getId(),
                userDetails.getUsername(),
                userDetails.getEmail(),
                roles,
                userDetails.isMustChangePassword()));
    }

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {
        if (!PasswordValidator.isValid(signUpRequest.getPassword())) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Error: " + PasswordValidator.getValidationMessage()));
        }

        if (userRepository.existsByUsername(signUpRequest.getUsername())) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Error: Username is already taken!"));
        }

        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Error: Email is already in use!"));
        }

        // Create new user's account
        User user = new User();
        user.setUsername(signUpRequest.getUsername());
        user.setEmail(signUpRequest.getEmail());
        
        Person person = new Person();
        person.setFirstName(signUpRequest.getFirstName());
        person.setLastName(signUpRequest.getLastName());
        person.setPhone(signUpRequest.getPhone());
        user.setPerson(person);
        
        user.setPassword(encoder.encode(signUpRequest.getPassword()));

        String strRole = signUpRequest.getRole();
        Role role;
        String requestedRole = (strRole == null) ? "USER" : strRole.toUpperCase();

        // Approval Logic: Admins and Experts are downgraded to USER initially
        boolean needsApproval = requestedRole.equals("ADMIN") || requestedRole.equals("EXPERT");
        String assignedRole = needsApproval ? "USER" : requestedRole;

        role = roleRepository.findByName(assignedRole)
                .orElseThrow(() -> new RuntimeException("Error: Role is not found."));

        user.setRole(role);
        userRepository.save(user);

        // If it was an elevated role request, notify existing admins
        if (needsApproval) {
            try {
                // Dependency injection for NotificationPublisher if not already there
                // I'll check if I need to @Autowired it
                notificationPublisher.sendRegistrationRequestEvent(user, requestedRole);
            } catch (Exception e) {
                System.err.println("Failed to send notification: " + e.getMessage());
            }
        }

        return ResponseEntity.ok(new MessageResponse("User registered successfully!"));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody java.util.Map<String, String> request) {
        String email = request.get("email");
        try {
            passwordResetService.createPasswordResetToken(email);
            return ResponseEntity.ok(new MessageResponse("Un link de resetare a fost trimis pe adresa de email."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody java.util.Map<String, String> request) {
        String token = request.get("token");
        String newPassword = request.get("password");

        if (!PasswordValidator.isValid(newPassword)) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Error: " + PasswordValidator.getValidationMessage()));
        }

        try {
            passwordResetService.resetPassword(token, newPassword);
            return ResponseEntity.ok(new MessageResponse("Parola a fost resetată cu succes!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
}

package com.example.aic.service;

import com.example.aic.dto.UserDTO;
import com.example.aic.model.Role;
import com.example.aic.model.User;
import com.example.aic.repository.RoleRepository;
import com.example.aic.repository.UserRepository;
import com.example.aic.repository.AvalancheRepository;
import com.example.aic.repository.ConditionsRepository;
import com.example.aic.repository.PasswordResetTokenRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private AvalancheRepository avalancheRepository;

    @Autowired
    private ConditionsRepository conditionsRepository;

    @Autowired
    private PasswordResetTokenRepository tokenRepository;

    public List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserDTO updateUserRole(Integer userId, String roleName) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Role role = roleRepository.findByName(roleName)
                .orElseGet(() -> {
                    Role newRole = new Role();
                    newRole.setName(roleName);
                    return roleRepository.save(newRole);
                });

        user.setRole(role);
        User savedUser = userRepository.save(user);

        // Notify user about role update
        try {
            notificationPublisher.sendRoleUpdateEvent(savedUser, roleName);
        } catch (Exception e) {
            // Log error but don't fail the transaction
            System.err.println("Failed to send role update notification: " + e.getMessage());
        }

        return convertToDto(savedUser);
    }

    @Autowired
    private NotificationPublisher notificationPublisher;

    @Transactional
    public void deleteUser(Integer userId) {
        // 1. Set visitor to NULL in Avalanche and Conditions (manual SET NULL because of DB constraint update issues)
        avalancheRepository.setVisitorToNull(userId);
        conditionsRepository.setVisitorToNull(userId);
        
        // 2. Delete password tokens
        userRepository.findById(userId).ifPresent(user -> {
            tokenRepository.deleteByUser(user);
            userRepository.delete(user);
        });
    }

    private UserDTO convertToDto(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setRoleName(user.getRole() != null ? user.getRole().getName() : null);
        dto.setCreatedAt(user.getCreatedAt());
        
        if (user.getPerson() != null) {
            dto.setFirstName(user.getPerson().getFirstName());
            dto.setLastName(user.getPerson().getLastName());
            dto.setPhone(user.getPerson().getPhone());
        }
        
        return dto;
    }
}

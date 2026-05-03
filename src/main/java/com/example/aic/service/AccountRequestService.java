package com.example.aic.service;

import com.example.aic.dto.AccountRequestDTO;
import com.example.aic.model.AccountRequest;
import com.example.aic.model.User;
import com.example.aic.model.Role;
import com.example.aic.model.Person;
import com.example.aic.repository.AccountRequestRepository;
import com.example.aic.repository.UserRepository;
import com.example.aic.repository.RoleRepository;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.security.SecureRandom;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AccountRequestService {
    private static final Logger logger = LoggerFactory.getLogger(AccountRequestService.class);

    @Autowired
    private AccountRequestRepository requestRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ModelMapper modelMapper;

    @Autowired
    private NotificationPublisher notificationPublisher;

    @Transactional
    public AccountRequestDTO submitRequest(AccountRequestDTO dto) {
        logger.info("Submitting new account request for: {}", dto.getEmail());
        
        // Check if user already exists
        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new RuntimeException("Un utilizator cu acest email există deja în sistem.");
        }

        AccountRequest request = null;
        try {
            request = modelMapper.map(dto, AccountRequest.class);
            if (request.getPerson() == null) request.setPerson(new Person());
            request.setEmail(dto.getEmail());
            request.getPerson().setFirstName(dto.getFirstName());
            request.getPerson().setLastName(dto.getLastName());
            request.getPerson().setPhone(dto.getPhone());
            
            request.setStatus(AccountRequest.RequestStatus.PENDING);
            request.setRequestedRole("USER"); // Enforce USER role for all public requests
            AccountRequest saved = requestRepository.save(request);
            
            logger.info("Account request saved with ID: {}", saved.getId());

            // Notify admin about new request (non-blocking failure)
            try {
                notificationPublisher.sendAvalancheCreatedEvent("O nouă cerere de cont a fost primită de la " + request.getEmail());
            } catch (Exception ne) {
                logger.warn("Failed to send notification for new account request: {}", ne.getMessage());
            }
            
            AccountRequestDTO savedDto = modelMapper.map(saved, AccountRequestDTO.class);
            savedDto.setFirstName(request.getPerson().getFirstName());
            savedDto.setLastName(request.getPerson().getLastName());
            savedDto.setEmail(request.getEmail());
            savedDto.setPhone(request.getPerson().getPhone());
            
            return savedDto;
        } catch (Exception e) {
            logger.error("Error submitting account request for {}: {}", request != null ? request.getEmail() : "unknown", e.getMessage(), e);
            throw e;
        }
    }

    @Transactional(readOnly = true)
    public List<AccountRequestDTO> getAllRequests() {
        logger.info("Fetching all account requests from DB");
        try {
            List<AccountRequest> list = requestRepository.findAll();
            logger.info("Found {} account requests", list.size());
            return list.stream()
                    .map(r -> {
                        try {
                            AccountRequestDTO dto = modelMapper.map(r, AccountRequestDTO.class);
                            if (r.getPerson() != null) {
                                dto.setFirstName(r.getPerson().getFirstName());
                                dto.setLastName(r.getPerson().getLastName());
                                dto.setEmail(r.getEmail());
                                dto.setPhone(r.getPerson().getPhone());
                            }
                            return dto;
                        } catch (Exception me) {
                            logger.error("Error mapping AccountRequest ID {}: {}", r.getId(), me.getMessage());
                            throw me;
                        }
                    })
                    .collect(Collectors.toList());
        } catch (Exception e) {
            logger.error("Error in getAllRequests service: {}", e.getMessage(), e);
            throw e;
        }
    }

    @Transactional
    public void approveRequest(Long requestId) {
        AccountRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        if (request.getStatus() != AccountRequest.RequestStatus.PENDING) {
            throw new RuntimeException("Request is already processed");
        }

        // Check if user already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Un utilizator cu acest email există deja în sistem.");
        }

        // 1. Generate random password
        String randomPassword = generateRandomPassword(12);

        // 2. Create User
        // 2. Create User
        User user = new User();
        user.setEmail(request.getEmail());
        // Initialize person object for user
        Person p = new Person();
        p.setFirstName(request.getPerson().getFirstName());
        p.setLastName(request.getPerson().getLastName());
        p.setPhone(request.getPerson().getPhone());
        user.setPerson(p);

        // Use a variant of email as username if not provided
        user.setUsername(request.getEmail().split("@")[0] + "_" + (int)(Math.random()*1000));
        user.setPassword(passwordEncoder.encode(randomPassword));
        
        Role role = roleRepository.findByName(request.getRequestedRole().toUpperCase())
                .orElseThrow(() -> new RuntimeException("Role not found"));
        user.setRole(role);
        user.setMustChangePassword(true);
        
        userRepository.save(user);

        // 3. Update request status
        request.setStatus(AccountRequest.RequestStatus.APPROVED);
        requestRepository.save(request);

        // 4. Send email (via RabbitMQ -> Notification Service)
        try {
            notificationPublisher.sendRegistrationApprovedEvent(user, randomPassword);
        } catch (Exception e) {
            logger.error("Failed to send approval notification for user {}: {}", user.getEmail(), e.getMessage());
            // We don't throw exception here to not rollback user creation and request approval
        }
    }

    @Transactional
    public void rejectRequest(Long requestId) {
        AccountRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));
        request.setStatus(AccountRequest.RequestStatus.REJECTED);
        requestRepository.save(request);
    }

    private String generateRandomPassword(int length) {
        String upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        String lower = "abcdefghijklmnopqrstuvwxyz";
        String digits = "0123456789";
        String special = "!@#$%^&*()_+-=[]{}|;':\",.<>?/";
        String allChars = upper + lower + digits + special;
        
        SecureRandom random = new SecureRandom();
        StringBuilder sb = new StringBuilder();
        
        // Ensure at least one of each
        sb.append(upper.charAt(random.nextInt(upper.length())));
        sb.append(lower.charAt(random.nextInt(lower.length())));
        sb.append(digits.charAt(random.nextInt(digits.length())));
        sb.append(special.charAt(random.nextInt(special.length())));
        
        for (int i = 4; i < length; i++) {
            sb.append(allChars.charAt(random.nextInt(allChars.length())));
        }
        
        // Shuffle the characters
        char[] chars = sb.toString().toCharArray();
        for (int i = chars.length - 1; i > 0; i--) {
            int j = random.nextInt(i + 1);
            char temp = chars[i];
            chars[i] = chars[j];
            chars[j] = temp;
        }
        
        return new String(chars);
    }
}

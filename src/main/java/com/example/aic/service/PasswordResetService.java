package com.example.aic.service;

import com.example.aic.model.PasswordResetToken;
import com.example.aic.model.User;
import com.example.aic.security.PasswordValidator;
import com.example.aic.repository.PasswordResetTokenRepository;
import com.example.aic.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
public class PasswordResetService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordResetTokenRepository tokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private NotificationPublisher notificationPublisher;

    @Transactional
    public void createPasswordResetToken(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Nu s-a găsit niciun utilizator cu acest email."));

        PasswordResetToken resetToken = tokenRepository.findByUser(user)
                .orElse(new PasswordResetToken());

        String token = UUID.randomUUID().toString();
        resetToken.setToken(token);
        resetToken.setUser(user);
        resetToken.setExpiryDate(LocalDateTime.now().plusHours(24));
        
        tokenRepository.save(resetToken);

        // Send notification
        notificationPublisher.sendPasswordResetEvent(user, token);
    }

    public Optional<User> validatePasswordResetToken(String token) {
        return tokenRepository.findByToken(token)
                .filter(t -> !t.isExpired())
                .map(PasswordResetToken::getUser);
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Token invalid."));

        if (resetToken.isExpired()) {
            throw new RuntimeException("Token-ul a expirat. Te rugăm să soliciți o nouă resetare.");
        }

        if (!PasswordValidator.isValid(newPassword)) {
            throw new RuntimeException(PasswordValidator.getValidationMessage());
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setMustChangePassword(false);
        userRepository.save(user);

        // Delete used token
        tokenRepository.delete(resetToken);
    }
}

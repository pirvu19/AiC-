package com.example.aic.service;

import com.example.aic.config.RabbitMQConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class NotificationPublisher {

    private static final Logger logger = LoggerFactory.getLogger(NotificationPublisher.class);

    @Autowired
    private RabbitTemplate rabbitTemplate;

    @Autowired
    private com.example.aic.repository.UserRepository userRepository;

    public void sendAvalancheCreatedEvent(String message) {
        logger.info("Picking random Expert for notification: {}", message);

        // Use "EXPERT" as in DataInitializer (without ROLE_ prefix)
        java.util.List<com.example.aic.model.User> targets = userRepository
                .findByRoleNameIn(java.util.Arrays.asList("EXPERT"));

        logger.info("Total potential Expert targets found in DB: {}", targets.size());

        String payload;
        if (!targets.isEmpty()) {
            com.example.aic.model.User luckyOne = targets.get(new java.util.Random().nextInt(targets.size()));
            payload = "TARGET:" + luckyOne.getUsername() + "|MSG:" + message;
            logger.info("Selected target: {}", luckyOne.getUsername());
        } else {
            logger.warn("No EXPERTS found in database! Broadcasting to ALL.");
            payload = "TARGET:ALL|MSG:" + message;
        }

        rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE_NAME, "avalanche.created", payload);
    }

    public void sendAvalancheValidatedEvent(String message) {
        logger.info("Sending avalanche validated event (Public Broadcast): {}", message);
        String payload = "TARGET:ALL|MSG:" + message;
        rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE_NAME, "avalanche.validated", payload);
    }

    public void sendRegistrationRequestEvent(com.example.aic.model.User user, String requestedRole) {
        logger.info("Sending registration request event for admin approval: {} -> {}", user.getUsername(), requestedRole);
        String message = "Utilizatorul " + user.getUsername() + " solicită rolul de " + requestedRole.toUpperCase();
        String payload = "TARGET:ALL|MSG:" + message;
        rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE_NAME, "avalanche.created", payload);
    }

    public void sendRoleUpdateEvent(com.example.aic.model.User user, String newRole) {
        logger.info("Sending role update event to user: {} -> {}", user.getUsername(), newRole);
        String message = "Rolul tău a fost actualizat la " + newRole.toUpperCase() + ". Felicitări!";
        String payload = "TARGET:" + user.getUsername() + "|MSG:" + message;
        rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE_NAME, "avalanche.validated", payload);
    }

    public void sendRegistrationApprovedEvent(com.example.aic.model.User user, String password) {
        logger.info("Sending registration approval event (Email with Password) for: {}", user.getEmail());
        // Updated format: USER:email|PWD:password|UNAME:username (Listener will find USER: and PWD: as before)
        String message = "USER:" + user.getEmail() + "|PWD:" + password + "|UNAME:" + user.getUsername();
        String payload = "TARGET:" + user.getUsername() + "|MSG:" + message;
        // Match the routing key used in previous plans if any, or use registration.approved
        rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE_NAME, "registration.approved", payload);
    }

    public void sendPasswordResetEvent(com.example.aic.model.User user, String token) {
        logger.info("Sending password reset event for: {}", user.getEmail());
        // Message format: USER:user@example.com|TOKEN:uuid
        String message = "USER:" + user.getEmail() + "|TOKEN:" + token;
        String payload = "TARGET:" + user.getUsername() + "|MSG:" + message;
        rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE_NAME, "password.reset", payload);
    }
}

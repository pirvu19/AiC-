package com.example.notificationservice.rabbit;

import com.example.notificationservice.config.RabbitMQConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class NotificationListener {

    private static final Logger logger = LoggerFactory.getLogger(NotificationListener.class);

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private com.example.notificationservice.service.EmailService emailService;

    @RabbitListener(queues = RabbitMQConfig.ADMIN_QUEUE)
    public void receiveAdminNotification(String message) {
        logger.info("Received Admin Notification: {}", message);
        messagingTemplate.convertAndSend("/topic/admin", message);
    }

    @RabbitListener(queues = RabbitMQConfig.USER_QUEUE)
    public void receiveUserNotification(String message) {
        logger.info("Received User Notification: {}", message);
        
        // Check if it's an email send request
        if (message.startsWith("SEND_EMAIL:")) {
            try {
                String[] parts = message.split("\\|", 3);
                String to = null;
                String subject = null;
                String body = null;
                
                for (String part : parts) {
                    if (part.startsWith("SEND_EMAIL:")) {
                        to = part.substring(11);
                    } else if (part.startsWith("SUBJECT:")) {
                        subject = part.substring(8);
                    } else if (part.startsWith("BODY:")) {
                        body = part.substring(5);
                    }
                }
                
                if (to != null && subject != null && body != null) {
                    logger.info("Processing SEND_EMAIL to destinatar: {}", to);
                    emailService.sendEmail(to, subject, body);
                }
            } catch (Exception e) {
                logger.error("Failed to parse and send email: {}", e.getMessage(), e);
            }
            return; // Intercept and stop WebSocket propagation
        }
        
        // Check if it's a registration approval (special format)
        if (message.contains("USER:") && message.contains("|PWD:")) {
            try {
                String[] parts = message.split("\\|");
                // Format: TARGET:username|MSG:USER:email|PWD:password
                String email = null;
                String password = null;
                String username = null;
                
                for (String part : parts) {
                    if (part.startsWith("MSG:USER:")) email = part.substring(9);
                    if (part.startsWith("PWD:")) password = part.substring(4);
                    if (part.startsWith("UNAME:")) username = part.substring(6);
                }
                
                if (email != null && password != null) {
                    logger.info("Processing registration approval for email: {}", email);
                    emailService.sendCredentialsEmail(email, username != null ? username : email, password);
                }
            } catch (Exception e) {
                logger.error("Failed to parse registration message or send email: {}", e.getMessage());
            }
        }
        
        // Check if it's a password reset (special format)
        if (message.contains("USER:") && message.contains("|TOKEN:")) {
            try {
                String[] parts = message.split("\\|");
                // Format: TARGET:username|MSG:USER:email|TOKEN:uuid
                String email = null;
                String token = null;
                
                for (String part : parts) {
                    if (part.startsWith("MSG:USER:")) email = part.substring(9);
                    if (part.startsWith("TOKEN:")) token = part.substring(6);
                }
                
                if (email != null && token != null) {
                    logger.info("Processing password reset for email: {}", email);
                    emailService.sendPasswordResetEmail(email, token);
                }
            } catch (Exception e) {
                logger.error("Failed to parse password reset message or send email: {}", e.getMessage());
            }
        }
        
        messagingTemplate.convertAndSend("/topic/users", message);
    }
}

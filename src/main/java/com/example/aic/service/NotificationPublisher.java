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
        logger.info("Broadcasting avalanche validation request to ALL ADMINS: {}", message);
        String payload = "TARGET:ROLE_ADMIN|MSG:" + message;
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
        String payload = "TARGET:ROLE_ADMIN|MSG:" + message;
        rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE_NAME, "avalanche.created", payload);
    }

    public void sendRoleUpdateEvent(com.example.aic.model.User user, String newRole) {
        logger.info("Sending role update event to user: {} -> {}", user.getUsername(), newRole);
        String message = "Rolul tău a fost actualizat la " + newRole.toUpperCase() + ". Felicitări!";
        String payload = "TARGET:" + user.getEmail() + "|MSG:" + message;
        rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE_NAME, "avalanche.validated", payload);
    }

    public void sendRegistrationApprovedEvent(com.example.aic.model.User user, String password) {
        logger.info("Sending registration approval event (Email with Password) for: {}", user.getEmail());
        // Updated format: USER:email|PWD:password|UNAME:username (Listener will find USER: and PWD: as before)
        String message = "USER:" + user.getEmail() + "|PWD:" + password + "|UNAME:" + user.getUsername();
        String payload = "TARGET:" + user.getEmail() + "|MSG:" + message;
        // Match the routing key used in previous plans if any, or use registration.approved
        rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE_NAME, "registration.approved", payload);
    }

    public void sendPasswordResetEvent(com.example.aic.model.User user, String token) {
        logger.info("Sending password reset event for: {}", user.getEmail());
        // Message format: USER:user@example.com|TOKEN:uuid
        String message = "USER:" + user.getEmail() + "|TOKEN:" + token;
        String payload = "TARGET:" + user.getEmail() + "|MSG:" + message;
        rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE_NAME, "password.reset", payload);
    }

    public void sendConditionsCreatedEvent(String message) {
        logger.info("Broadcasting conditions validation request to ALL ADMINS: {}", message);
        String payload = "TARGET:ROLE_ADMIN|MSG:" + message;
        rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE_NAME, "conditions.created", payload);
    }

    public void sendConditionsValidatedEvent(String message) {
        logger.info("Sending conditions validated event (Public Broadcast): {}", message);
        String payload = "TARGET:ALL|MSG:" + message;
        rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE_NAME, "conditions.validated", payload);
    }

    public void sendAvalancheEmailNotification(com.example.aic.model.Avalanche avalanche) {
        try {
            com.example.aic.model.TechnicalDetails tech = avalanche.getTechnicalDetails();
            com.example.aic.model.DamagesAndVictims damages = avalanche.getDamagesAndVictims();

            StringBuilder sb = new StringBuilder();
            sb.append("Detalii Eveniment:\n\n");
            sb.append("* Data : ").append(avalanche.getDate() != null ? avalanche.getDate().toString() : "-").append("\n");
            sb.append("* Ora : ").append(avalanche.getEventTime() != null ? avalanche.getEventTime() : "-").append("\n");
            sb.append("* Echipament de protectie: ").append(avalanche.getSafetyEquipment() != null ? avalanche.getSafetyEquipment() : "-").append("\n");
            sb.append("* Coordonate GPS zona declansare: ").append(avalanche.getLatitude() != null && avalanche.getLongitude() != null ? (avalanche.getLatitude() + ", " + avalanche.getLongitude()) : "-").append("\n");
            
            String gpsAccum = "-";
            String alt = "-";
            String slope = "-";
            String relSize = "-";
            String crownDepth = "-";
            String crownWidth = "-";
            String accumArea = "-";
            String runout = "-";

            if (tech != null) {
                if (tech.getAccumLat() != null && tech.getAccumLng() != null) {
                    gpsAccum = tech.getAccumLat() + ", " + tech.getAccumLng();
                }
                if (tech.getAltitude() != null) {
                    alt = tech.getAltitude().toString();
                }
                if (tech.getSlopeInterpolation() != null) {
                    slope = tech.getSlopeInterpolation().toString();
                }
                if (tech.getRelativeSize() != null) {
                    relSize = tech.getRelativeSize();
                }
                if (tech.getCrownDepth() != null) {
                    crownDepth = tech.getCrownDepth().toString();
                }
                if (tech.getCrownWidth() != null) {
                    crownWidth = tech.getCrownWidth().toString();
                }
                if (tech.getAccumulationArea() != null) {
                    accumArea = tech.getAccumulationArea().toString();
                }
                if (tech.getRunoutVerticalDrop() != null) {
                    runout = tech.getRunoutVerticalDrop().toString();
                }
            }

            sb.append("* Coordonate GPS zona acumulare: ").append(gpsAccum).append("\n");
            sb.append("* Masiv : ").append(avalanche.getMassif() != null ? avalanche.getMassif().getName() : "-").append("\n");
            sb.append("* Zona din masiv: ").append(avalanche.getZone() != null ? avalanche.getZone() : "-").append("\n");
            sb.append("* Altitudine : ").append(alt).append("\n");
            sb.append("* Orientarea pantei : ").append(avalanche.getOrientation() != null ? avalanche.getOrientation().getDirection() : "-").append("\n");
            sb.append("* Inclinatia pantei : ").append(slope).append("\n");
            sb.append("* Activitate : ").append(avalanche.getActivity() != null ? avalanche.getActivity() : "-").append("\n");
            sb.append("* Tipul avalansei : ").append(avalanche.getType() != null ? avalanche.getType().getName() : "-").append("\n");
            sb.append("* Factorul de declansare al avalansei : ").append(avalanche.getCause() != null ? avalanche.getCause().getDescription() : "-").append("\n");
            sb.append("* Marimea avalansei - Relativ la urma : ").append(relSize).append("\n");
            sb.append("* Adancimea coroanei(placii) : ").append(crownDepth).append("\n");
            sb.append("* Latimea coroanei : ").append(crownWidth).append("\n");
            sb.append("* Largime zona de acumulare: ").append(accumArea).append("\n");
            sb.append("* Diferenta de nivel de rulare : ").append(runout).append("\n");

            String caught = "-";
            String partially = "-";
            String fully = "-";
            String injured = "-";
            String killed = "-";
            String matDamage = "-";

            if (damages != null) {
                if (damages.getPersonsCaught() != null) caught = damages.getPersonsCaught().toString();
                if (damages.getPersonsPartially() != null) partially = damages.getPersonsPartially().toString();
                if (damages.getPersonsFully() != null) fully = damages.getPersonsFully().toString();
                if (damages.getPersonsInjured() != null) injured = damages.getPersonsInjured().toString();
                if (damages.getPersonsKilled() != null) killed = damages.getPersonsKilled().toString();
                if (damages.getMaterialDamage() != null) matDamage = damages.getMaterialDamage().toString();
            }

            sb.append("* Numar de persoane surprinse : ").append(caught).append("\n");
            sb.append("* Numar de persoane acoperite partial : ").append(partially).append("\n");
            sb.append("* Numar de persoane acoperite total : ").append(fully).append("\n");
            sb.append("* Numar de persoane accidentate : ").append(injured).append("\n");
            sb.append("* Numar de persoane decedate : ").append(killed).append("\n");
            sb.append("* Pagube materiale: ").append(matDamage).append("\n");

            String payload = "SEND_EMAIL:razvan.pirvu9@gmail.com|SUBJECT:postare noua pe blog|BODY:" + sb.toString();
            logger.info("Publishing avalanche email notification payload to RabbitMQ");
            rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE_NAME, "avalanche.validated.email", payload);
        } catch (Exception e) {
            logger.error("Failed to compile or publish email notification", e);
        }
    }
}

package com.example.notificationservice.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @org.springframework.beans.factory.annotation.Value("${spring.mail.username}")
    private String fromEmail;

    public void sendCredentialsEmail(String to, String username, String password) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(to);
        message.setSubject("Cont AIC Creat - Date Autentificare");
        message.setText("Bună ziua,\n\n" +
                "Contul dumneavoastră pe platforma AIC a fost creat cu succes de către un administrator.\n\n" +
                "Datele de autentificare sunt:\n" +
                "Utilizator: " + (username != null ? username : to) + "\n" +
                "Parolă temporară: " + password + "\n\n" +
                "Vă rugăm să schimbați parola după prima autentificare.\n\n" +
                "Echipa AIC");
        
        mailSender.send(message);
    }

    @org.springframework.beans.factory.annotation.Value("${app.frontend.url}")
    private String frontendUrl;

    public void sendPasswordResetEmail(String to, String token) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(to);
        message.setSubject("Resetare Parolă AIC");
        
        String resetUrl = frontendUrl + "/reset-password?token=" + token;
        
        message.setText("Bună ziua,\n\n" +
                "Ați solicitat resetarea parolei pentru contul dumneavoastră AIC.\n\n" +
                "Vă rugăm să dați click pe link-ul de mai jos pentru a alege o parolă nouă. " +
                "Link-ul este valabil timp de 30 de minute.\n\n" +
                resetUrl + "\n\n" +
                "Dacă nu ați solicitat dumneavoastră acest lucru, vă rugăm să ignorați acest email.\n\n" +
                "Echipa AIC");
        
        mailSender.send(message);
    }

    public void sendEmail(String to, String subject, String body) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);
        mailSender.send(message);
    }
}

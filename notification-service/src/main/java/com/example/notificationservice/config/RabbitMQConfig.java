package com.example.notificationservice.config;

import org.springframework.amqp.core.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String EXCHANGE_NAME = "avalanche_exchange";
    public static final String ADMIN_QUEUE = "admin_notifications_queue";
    public static final String USER_QUEUE = "user_notifications_queue";

    @Bean
    public TopicExchange avalancheExchange() {
        return new TopicExchange(EXCHANGE_NAME);
    }

    @Bean
    public Queue adminQueue() {
        return new Queue(ADMIN_QUEUE);
    }

    @Bean
    public Queue userQueue() {
        return new Queue(USER_QUEUE);
    }

    @Bean
    public Binding bindingAdmin(Queue adminQueue, TopicExchange avalancheExchange) {
        return BindingBuilder.bind(adminQueue).to(avalancheExchange).with("avalanche.created");
    }

    @Bean
    public Binding bindingUser(Queue userQueue, TopicExchange avalancheExchange) {
        return BindingBuilder.bind(userQueue).to(avalancheExchange).with("avalanche.validated");
    }

    @Bean
    public Binding bindingRegistration(Queue userQueue, TopicExchange avalancheExchange) {
        return BindingBuilder.bind(userQueue).to(avalancheExchange).with("registration.approved");
    }

    @Bean
    public Binding bindingPasswordReset(Queue userQueue, TopicExchange avalancheExchange) {
        return BindingBuilder.bind(userQueue).to(avalancheExchange).with("password.reset");
    }

    @Bean
    public Binding bindingConditionsCreated(Queue adminQueue, TopicExchange avalancheExchange) {
        return BindingBuilder.bind(adminQueue).to(avalancheExchange).with("conditions.created");
    }

    @Bean
    public Binding bindingConditionsValidated(Queue userQueue, TopicExchange avalancheExchange) {
        return BindingBuilder.bind(userQueue).to(avalancheExchange).with("conditions.validated");
    }
}

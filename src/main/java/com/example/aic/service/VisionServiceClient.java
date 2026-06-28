package com.example.aic.service;

import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@Service
public class VisionServiceClient {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${app.vision.service.url}")
    private String visionServiceUrl;

    public boolean validateImage(MultipartFile file) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            
            // Convert MultipartFile to ByteArrayResource for RestTemplate
            ByteArrayResource resource = new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename();
                }
            };
            
            body.add("file", resource);

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(visionServiceUrl, requestEntity, Map.class);

            if (response != null && response.containsKey("valid")) {
                boolean isValid = (Boolean) response.get("valid");
                String label = (String) response.get("top_label");
                Double score = (Double) response.get("confidence");
                System.out.println("AI Validation for " + file.getOriginalFilename() + ": " + isValid + " (Label: " + label + ", Score: " + score + ")");
                return isValid;
            }

            return true; // Fallback to true if service fails (don't block user if AI has issues)
        } catch (Exception e) {
            System.err.println("Vision service error: " + e.getMessage());
            return true; // Fallback
        }
    }
}

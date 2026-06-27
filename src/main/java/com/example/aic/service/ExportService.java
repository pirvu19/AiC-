package com.example.aic.service;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.dataformat.csv.CsvMapper;
import com.fasterxml.jackson.dataformat.csv.CsvSchema;
import com.fasterxml.jackson.dataformat.xml.XmlMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.List;

@Service
public class ExportService {

    private final com.fasterxml.jackson.databind.ObjectMapper jsonMapper;
    private final XmlMapper xmlMapper;
    private final CsvMapper csvMapper;

    // MixIn to ignore unwanted fields globally during export
    abstract static class AvalancheExportMixIn {
        @JsonIgnore abstract Integer getId();
        @JsonIgnore abstract String getLink();
        @JsonIgnore abstract Integer getMassifId();
        @JsonIgnore abstract Integer getTypeId();
        @JsonIgnore abstract Integer getCauseId();
        @JsonIgnore abstract Integer getOrientationId();
        @JsonIgnore abstract String getStatus();
        @JsonIgnore abstract Integer getVisitorId();
        @JsonIgnore abstract Object getGuestContactInfo();
    }

    // MixIn to ignore nested objects in CSV (inherits global ignores)
    abstract static class AvalancheCsvMixIn extends AvalancheExportMixIn {
        @JsonIgnore abstract Object getTechnicalDetails();
        @JsonIgnore abstract Object getDamagesAndVictims();
    }

    // MixIn to ignore unwanted fields globally for Conditions during export
    abstract static class ConditionsExportMixIn {
        @JsonIgnore abstract Integer getId();
        @JsonIgnore abstract String getStatus();
        @JsonIgnore abstract Integer getRegionId();
        @JsonIgnore abstract Integer getMassifId();
        @JsonIgnore abstract Integer getVisitorId();
        @JsonIgnore abstract Object getGuestContactInfo();
        @JsonIgnore abstract Object getCreatedAt();
    }

    abstract static class ConditionsCsvMixIn extends ConditionsExportMixIn {
    }

    public ExportService() {
        this.jsonMapper = new com.fasterxml.jackson.databind.ObjectMapper();
        this.jsonMapper.registerModule(new JavaTimeModule());
        this.jsonMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        this.xmlMapper = new XmlMapper();
        this.xmlMapper.registerModule(new JavaTimeModule());
        this.xmlMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        this.csvMapper = new CsvMapper();
        this.csvMapper.registerModule(new JavaTimeModule());
        this.csvMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        this.csvMapper.configure(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        // Important: Use a feature that allows writing nested objects as strings or ignoring them in CSV
        this.csvMapper.disable(com.fasterxml.jackson.databind.SerializationFeature.FAIL_ON_EMPTY_BEANS);
        
        // Apply global export mixins to JSON and XML
        this.jsonMapper.addMixIn(com.example.aic.dto.AvalancheDTO.class, AvalancheExportMixIn.class);
        this.jsonMapper.addMixIn(com.example.aic.dto.ConditionsDTO.class, ConditionsExportMixIn.class);
        this.xmlMapper.addMixIn(com.example.aic.dto.AvalancheDTO.class, AvalancheExportMixIn.class);
        this.xmlMapper.addMixIn(com.example.aic.dto.ConditionsDTO.class, ConditionsExportMixIn.class);

        // Add MixIns only for CSV
        this.csvMapper.addMixIn(com.example.aic.dto.AvalancheDTO.class, AvalancheCsvMixIn.class);
        this.csvMapper.addMixIn(com.example.aic.dto.ConditionsDTO.class, ConditionsCsvMixIn.class);
    }

    public <T> byte[] export(List<T> data, String format, Class<T> clazz) throws IOException {
        if (data == null || data.isEmpty()) {
            return new byte[0];
        }

        switch (format.toLowerCase()) {
            case "json":
                return jsonMapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(data);
            case "xml":
                return xmlMapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(data);
            case "csv":
                // Create a schema that only includes non-object fields
                CsvSchema schema = csvMapper.schemaFor(clazz).withHeader().withColumnReordering(true);
                return csvMapper.writer(schema).writeValueAsBytes(data);
            default:
                throw new IllegalArgumentException("Unsupported format: " + format);
        }
    }
}

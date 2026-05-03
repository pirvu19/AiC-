package com.example.aic.service;

import com.example.aic.model.*;
import com.example.aic.repository.*;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;

import java.io.IOException;
import java.util.*;

@Service
public class AvalancheSyncService {

    private static final Logger log = LoggerFactory.getLogger(AvalancheSyncService.class);

    private final AvalancheRepository avalancheRepository;
    private final MassifRepository massifRepository;
    private final AvalancheTypeRepository avalancheTypeRepository;
    private final AvalancheCauseRepository avalancheCauseRepository;
    private final OrientationRepository orientationRepository;

    public AvalancheSyncService(
            AvalancheRepository avalancheRepository,
            MassifRepository massifRepository,
            AvalancheTypeRepository avalancheTypeRepository,
            AvalancheCauseRepository avalancheCauseRepository,
            OrientationRepository orientationRepository) {
        this.avalancheRepository = avalancheRepository;
        this.massifRepository = massifRepository;
        this.avalancheTypeRepository = avalancheTypeRepository;
        this.avalancheCauseRepository = avalancheCauseRepository;
        this.orientationRepository = orientationRepository;
    }

    public SyncReport syncAll() {
        List<Avalanche> avalanches = avalancheRepository.findAllWithLink();
        SyncReport report = new SyncReport(avalanches.size());

        for (Avalanche avalanche : avalanches) {
            try {
                ScrapedData scraped = scrapeFromUrl(avalanche.getLink());
                boolean updated = processSingleAvalanche(avalanche, scraped);
                if (updated) {
                    report.incrementUpdated();
                    log.info("Updated avalanche id={} title={}", avalanche.getId(), avalanche.getTitle());
                } else {
                    report.incrementSkipped();
                }
                // Delay to prevent getting IP banned by the source
                Thread.sleep(1500);
            } catch (Exception e) {
                report.addError(avalanche.getId(), e.getMessage());
                log.error("Failed to sync avalanche id={}: {}", avalanche.getId(), e.getMessage());
            }
        }

        log.info("Sync complete: {}", report);
        return report;
    }

    public SyncReport syncOne(Integer avalancheId) {
        Avalanche avalanche = avalancheRepository.findById(avalancheId)
                .orElseThrow(() -> new IllegalArgumentException("Avalanche not found: " + avalancheId));

        if (avalanche.getLink() == null || avalanche.getLink().isBlank()) {
            throw new IllegalStateException("Avalanche id=" + avalancheId + " has no link stored.");
        }

        SyncReport report = new SyncReport(1);
        try {
            ScrapedData scraped = scrapeFromUrl(avalanche.getLink());
            boolean updated = processSingleAvalanche(avalanche, scraped);
            if (updated)
                report.incrementUpdated();
            else
                report.incrementSkipped();
        } catch (Exception e) {
            report.addError(avalancheId, e.getMessage());
        }
        return report;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean processSingleAvalanche(Avalanche entity, ScrapedData scraped) {
        boolean changed = false;

        if (scraped.massifName != null) {
            Massif massif = findMassif(scraped.massifName);
            if (massif != null && !massif.equals(entity.getMassif())) {
                entity.setMassif(massif);
                changed = true;
            }
        }

        if (scraped.zoneDescription != null && !scraped.zoneDescription.equals("-")
                && !scraped.zoneDescription.isBlank()) {
            entity.setZone(scraped.zoneDescription);
            changed = true;
        }

        if (scraped.activity != null && !scraped.activity.equals("-") && !scraped.activity.isBlank()) {
            entity.setActivity(scraped.activity);
            changed = true;
        }

        if (scraped.safetyEquipment != null && !scraped.safetyEquipment.equalsIgnoreCase("NA")) {
            entity.setSafetyEquipment(scraped.safetyEquipment);
            changed = true;
        }

        if (scraped.eventTime != null && !scraped.eventTime.equalsIgnoreCase("NA")) {
            entity.setEventTime(scraped.eventTime);
            changed = true;
        }

        if (scraped.declansareLat != null && scraped.declansareLng != null) {
            entity.setLatitude(scraped.declansareLat);
            entity.setLongitude(scraped.declansareLng);
            changed = true;
        }

        if (scraped.avalancheType != null) {
            AvalancheType type = findType(scraped.avalancheType);
            if (type != null && !type.equals(entity.getType())) {
                entity.setType(type);
                changed = true;
            }
        }

        if (scraped.cause != null) {
            AvalancheCause cause = findCause(scraped.cause);
            if (cause != null && !cause.equals(entity.getCause())) {
                entity.setCause(cause);
                changed = true;
            }
        }

        if (scraped.orientation != null) {
            Orientation orientation = findOrientation(scraped.orientation);
            if (orientation != null && !orientation.equals(entity.getOrientation())) {
                entity.setOrientation(orientation);
                changed = true;
            }
        }

        TechnicalDetails tech = entity.getTechnicalDetails();
        if (tech == null) {
            tech = new TechnicalDetails();
            tech.setAvalanche(entity);
            entity.setTechnicalDetails(tech);
            changed = true;
        }

        if (scraped.altitude != null) {
            tech.setAltitude(scraped.altitude);
            changed = true;
        }
        if (scraped.slopeAngle != null) {
            tech.setSlopeInterpolation(scraped.slopeAngle);
            changed = true;
        }
        if (scraped.crownWidth != null) {
            tech.setCrownWidth(scraped.crownWidth);
            changed = true;
        }
        if (scraped.crownDepth != null) {
            tech.setCrownDepth(scraped.crownDepth);
            changed = true;
        }
        if (scraped.crownDepthText != null) {
            tech.setCrownDepthText(scraped.crownDepthText);
            changed = true;
        }
        if (scraped.trackLength != null) {
            tech.setTrackLength(scraped.trackLength);
            changed = true;
        }
        if (scraped.verticalDrop != null) {
            tech.setVerticalDrop(scraped.verticalDrop);
            changed = true;
        }
        if (scraped.accumulationWidth != null) {
            tech.setAccumulationArea((float) scraped.accumulationWidth);
            changed = true;
        }
        if (scraped.accumLat != null) {
            tech.setAccumLat(scraped.accumLat);
            changed = true;
        }
        if (scraped.accumLng != null) {
            tech.setAccumLng(scraped.accumLng);
            changed = true;
        }
        if (scraped.relativeSize != null) {
            tech.setRelativeSize(scraped.relativeSize);
            changed = true;
        }

        DamagesAndVictims damages = entity.getDamagesAndVictims();
        if (damages == null) {
            damages = new DamagesAndVictims();
            damages.setAvalanche(entity);
            entity.setDamagesAndVictims(damages);
            changed = true;
        }

        if (scraped.personsCaught != null) {
            damages.setPersonsCaught(scraped.personsCaught);
            changed = true;
        }
        if (scraped.personsPartially != null) {
            damages.setPersonsPartially(scraped.personsPartially);
            changed = true;
        }
        if (scraped.personsFully != null) {
            damages.setPersonsFully(scraped.personsFully);
            changed = true;
        }
        if (scraped.personsInjured != null) {
            damages.setPersonsInjured(scraped.personsInjured);
            changed = true;
        }
        if (scraped.personsKilled != null) {
            damages.setPersonsKilled(scraped.personsKilled);
            changed = true;
        }
        if (scraped.materialDamage != null) {
            damages.setMaterialDamage(scraped.materialDamage);
            changed = true;
        }

        if (changed) {
            avalancheRepository.save(entity);
        }

        return changed;
    }

    private Massif findMassif(String name) {
        if (name == null)
            return null;
        return massifRepository.findAll().stream()
                .filter(m -> name.toLowerCase().contains(m.getName().toLowerCase())
                        || m.getName().toLowerCase().contains(name.toLowerCase()))
                .findFirst().orElse(null);
    }

    private AvalancheType findType(String name) {
        if (name == null)
            return null;
        return avalancheTypeRepository.findAll().stream()
                .filter(t -> name.toLowerCase().contains(t.getName().toLowerCase())
                        || t.getName().toLowerCase().contains(name.toLowerCase()))
                .findFirst().orElse(null);
    }

    private AvalancheCause findCause(String name) {
        if (name == null || name.isBlank())
            return null;
        String lowerName = name.toLowerCase().replace("ș", "s").replace("ț", "t").replace("ă", "a").replace("î", "i")
                .replace("â", "a");

        List<AvalancheCause> allCauses = avalancheCauseRepository.findAll();

        // 1. Full string match
        AvalancheCause match = allCauses.stream()
                .filter(c -> lowerName.contains(c.getDescription().toLowerCase())
                        || c.getDescription().toLowerCase().contains(lowerName))
                .findFirst().orElse(null);
        if (match != null)
            return match;

        // 2. Comma separated match
        String[] parts = lowerName.split(",");
        for (String part : parts) {
            String p = part.trim();
            if (p.isEmpty())
                continue;
            match = allCauses.stream()
                    .filter(c -> c.getDescription().toLowerCase().contains(p)
                            || p.contains(c.getDescription().toLowerCase()))
                    .findFirst().orElse(null);
            if (match != null)
                return match;
        }

        // 3. Keyword heuristics
        if (lowerName.contains("spontan")) {
            return allCauses.stream().filter(c -> c.getDescription().toLowerCase().contains("spontan")).findFirst()
                    .orElse(null);
        }
        if (lowerName.contains("umezire")) {
            return allCauses.stream().filter(c -> c.getDescription().toLowerCase().contains("umezire")).findFirst()
                    .orElse(null);
        }
        if (lowerName.contains("snowmobil")) {
            return allCauses.stream().filter(c -> c.getDescription().toLowerCase().contains("snowmobil")).findFirst()
                    .orElse(null);
        }
        if (lowerName.contains("incalzir") || lowerName.contains("ploi") || lowerName.contains("topire")) {
            return allCauses.stream().filter(c -> c.getDescription().toLowerCase().contains("topire")
                    || c.getDescription().toLowerCase().contains("incalzire")).findFirst().orElse(null);
        }
        if (lowerName.contains("vant")) {
            return allCauses.stream().filter(c -> c.getDescription().toLowerCase().contains("vant")).findFirst()
                    .orElse(null);
        }

        return null;
    }

    private Orientation findOrientation(String name) {
        if (name == null)
            return null;
        return orientationRepository.findAll().stream()
                .filter(o -> name.toLowerCase().equals(o.getDirection().toLowerCase()))
                .findFirst().orElse(null);
    }

    ScrapedData scrapeFromUrl(String url) throws IOException {
        Document doc = Jsoup.connect(url)
                .userAgent(
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36")
                .header("Accept",
                        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8")
                .header("Accept-Language", "ro-RO,ro;q=0.9,en-US;q=0.8,en;q=0.7")
                .header("Connection", "keep-alive")
                .header("Upgrade-Insecure-Requests", "1")
                .header("Sec-Fetch-Dest", "document")
                .header("Sec-Fetch-Mode", "navigate")
                .header("Sec-Fetch-Site", "none")
                .header("Sec-Fetch-User", "?1")
                .ignoreHttpErrors(true)
                .timeout(15_000)
                .get();
        return parseDocument(doc);
    }

    ScrapedData parseDocument(Document doc) {
        String fullText = doc.body().text().replace('\u00A0', ' ');
        ScrapedData data = new ScrapedData();

        data.massifName = extractAfter(fullText, "Masiv :");
        data.zoneDescription = extractAfter(fullText, "Zona din masiv :");
        data.activity = extractAfter(fullText, "Activitate :");
        data.safetyEquipment = extractAfter(fullText, "Echipament de protectie:");
        data.avalancheType = extractAfter(fullText, "Tipul avalansei :");

        java.util.regex.Matcher m = java.util.regex.Pattern
                .compile("(?i)factor(?:ul)?\\s*de\\s*declan[sș]are(?:\\s*al\\s*avalan[sș]ei)?\\s*:\\s*([^\r\n\\*]*)")
                .matcher(fullText);
        String bestCause = null;
        while (m.find()) {
            String matchStr = m.group(1).trim();
            if (bestCause == null || matchStr.length() > bestCause.length()) {
                bestCause = matchStr; // take the longest descriptive match
            }
        }
        if (bestCause != null) {
            data.cause = bestCause;
            log.info("REGEX FOUND CAUSE: '{}'", data.cause);
        } else {
            log.warn("REGEX DID NOT FIND CAUSE. FULLTEXT SNIPPET: {}",
                    fullText.substring(0, Math.min(500, fullText.length())));
        }

        data.eventTime = extractAfter(fullText, "Ora :");
        data.orientation = extractAfter(fullText, "Orientarea pantei :");

        data.altitude        = parseAverageInt(extractAfter(fullText, "Altitudine :"));
        data.slopeAngle      = parseAverageInt(extractAfter(fullText, "Inclinatia pantei :"));
        data.crownWidth      = parseAverageInt(extractAfter(fullText, "Latimea coroanei :"));
        data.accumulationWidth = parseAverageInt(extractAfter(fullText, "Largime zona de acumulare:"));
        data.verticalDrop    = parseAverageInt(extractAfter(fullText, "Diferenta de nivel de rulare :"));

        String trackRaw = extractAfter(fullText, "Relativ la urma :");
        if (trackRaw != null) {
            data.trackLength = parseAverageInt(trackRaw);
            data.relativeSize = trackRaw.trim();
        }

        String crownDepthRaw = extractAfter(fullText, "Adancimea coroanei(placii) :");
        if (crownDepthRaw != null) {
            data.crownDepthText = crownDepthRaw.trim();
            data.crownDepth = parseAverageInt(crownDepthRaw);
        }

        String declansareRaw = extractAfter(fullText, "Coordonate GPS zona de declansare:");
        if (declansareRaw == null)
            declansareRaw = extractAfter(fullText, "Coordonate GPS zona declansare:");
        parseCoordinates(declansareRaw, data, true);

        String acumulareRaw = extractAfter(fullText, "Coordonate GPS zona de acumulare:");
        if (acumulareRaw == null)
            acumulareRaw = extractAfter(fullText, "Coordonate GPS zona acumulare:");
        parseCoordinates(acumulareRaw, data, false);

        data.personsCaught = extractInt(fullText, "Numar de persoane surprinse :", null);
        data.personsPartially = extractInt(fullText, "Numar de persoane acoperite partial :", null);
        data.personsFully = extractInt(fullText, "Numar de persoane acoperite total :", null);
        data.personsInjured = extractInt(fullText, "Numar de persoane accidentate :", null);
        data.personsKilled = extractInt(fullText, "Numar de persoane decedate :", null);
        data.materialDamage = extractInt(fullText, "Pagube materiale:", null);

        return data;
    }

    private void parseCoordinates(String raw, ScrapedData data, boolean isDeclansare) {
        if (raw == null)
            return;
        String[] parts = raw.split(",");
        if (parts.length >= 2) {
            try {
                double lat = Double.parseDouble(parts[0].trim());
                double lng = Double.parseDouble(parts[1].trim());
                if (isDeclansare) {
                    data.declansareLat = lat;
                    data.declansareLng = lng;
                } else {
                    data.accumLat = lat;
                    data.accumLng = lng;
                }
            } catch (NumberFormatException ignored) {
            }
        }
    }

    private String extractAfter(String text, String label) {
        int idx = text.indexOf(label);
        if (idx == -1)
            return null;
        String after = text.substring(idx + label.length()).trim();
        int end = after.indexOf('*');
        if (end > 0)
            after = after.substring(0, end).trim();
        return after.isBlank() ? null : after;
    }

    private Integer extractInt(String text, String label, String suffix) {
        String raw = extractAfter(text, label);
        if (raw == null)
            return null;
        if (suffix != null) {
            int idx = raw.indexOf(suffix);
            if (idx > 0)
                raw = raw.substring(0, idx);
        }
        return extractIntFromText(raw);
    }

    private Integer extractIntFromText(String text) {
        if (text == null)
            return null;
        String digits = text.replaceAll("[^0-9]", "");
        if (digits.isEmpty())
            return null;
        try {
            return Integer.parseInt(digits);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Integer parseAverageInt(String raw) {
        if (raw == null)
            return null;
        String cleaned = raw.replaceAll("[^0-9\\-]", "").trim();
        if (cleaned.contains("-")) {
            String[] parts = cleaned.split("-");
            if (parts.length >= 2) {
                try {
                    int a = Integer.parseInt(parts[0].trim());
                    int b = Integer.parseInt(parts[1].trim());
                    return (a + b) / 2;
                } catch (NumberFormatException e) {
                    return null;
                }
            }
        }
        try {
            return Integer.parseInt(cleaned);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    static class ScrapedData {
        String massifName, zoneDescription, activity, safetyEquipment;
        String avalancheType, cause, orientation, eventTime;
        String crownDepthText;
        Double declansareLat, declansareLng, accumLat, accumLng;
        Integer altitude, slopeAngle, crownWidth, crownDepth;
        Integer trackLength, verticalDrop, accumulationWidth;
        String relativeSize;
        Integer personsCaught, personsPartially, personsFully;
        Integer personsInjured, personsKilled, materialDamage;
    }

    public static class SyncReport {
        private final int total;
        private int updated = 0;
        private int skipped = 0;
        private final List<String> errors = new ArrayList<>();

        public SyncReport(int total) {
            this.total = total;
        }

        public void incrementUpdated() {
            updated++;
        }

        public void incrementSkipped() {
            skipped++;
        }

        public void addError(Integer id, String msg) {
            errors.add("id=" + id + ": " + msg);
        }

        public int getTotal() {
            return total;
        }

        public int getUpdated() {
            return updated;
        }

        public int getSkipped() {
            return skipped;
        }

        public List<String> getErrors() {
            return errors;
        }
    }
}

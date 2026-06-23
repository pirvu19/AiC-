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
    private final AvalancheImageRepository avalancheImageRepository;

    public AvalancheSyncService(
            AvalancheRepository avalancheRepository,
            MassifRepository massifRepository,
            AvalancheTypeRepository avalancheTypeRepository,
            AvalancheCauseRepository avalancheCauseRepository,
            OrientationRepository orientationRepository,
            AvalancheImageRepository avalancheImageRepository) {
        this.avalancheRepository = avalancheRepository;
        this.massifRepository = massifRepository;
        this.avalancheTypeRepository = avalancheTypeRepository;
        this.avalancheCauseRepository = avalancheCauseRepository;
        this.orientationRepository = orientationRepository;
        this.avalancheImageRepository = avalancheImageRepository;
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

        // Sincronizare Imagini
        if (scraped.imageUrls != null && !scraped.imageUrls.isEmpty()) {
            if (entity.getImages() != null) {
                for (AvalancheImage oldImg : new ArrayList<>(entity.getImages())) {
                    deleteImageFile(oldImg.getImageUrl());
                    avalancheImageRepository.delete(oldImg);
                }
                entity.getImages().clear();
            } else {
                entity.setImages(new ArrayList<>());
            }

            int count = 0;
            for (String imgUrl : scraped.imageUrls) {
                if (count >= 4) break;
                String localUrl = downloadAndStoreImage(imgUrl);
                if (localUrl != null) {
                    AvalancheImage newImg = new AvalancheImage();
                    newImg.setAvalanche(entity);
                    newImg.setImageUrl(localUrl);
                    entity.getImages().add(newImg);
                    count++;
                }
            }
            changed = true;
        }

        if (changed) {
            avalancheRepository.save(entity);
        }

        return changed;
    }

    private String downloadAndStoreImage(String imgUrl) {
        try {
            byte[] imageBytes = Jsoup.connect(imgUrl)
                    .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36")
                    .ignoreContentType(true)
                    .execute()
                    .bodyAsBytes();

            String originalName = imgUrl.substring(imgUrl.lastIndexOf("/") + 1);
            String fileExtension = "";
            if (originalName.contains(".")) {
                fileExtension = originalName.substring(originalName.lastIndexOf("."));
            }
            if (fileExtension.isEmpty() || fileExtension.length() > 5) {
                fileExtension = ".jpg";
            }

            String fileName = UUID.randomUUID().toString() + fileExtension;
            java.nio.file.Path targetFolder = java.nio.file.Paths.get("uploads").resolve("avalanches").toAbsolutePath().normalize();
            java.nio.file.Files.createDirectories(targetFolder);
            java.nio.file.Path targetLocation = targetFolder.resolve(fileName);
            
            java.nio.file.Files.write(targetLocation, imageBytes);
            return "/uploads/avalanches/" + fileName;
        } catch (Exception e) {
            log.error("Failed to download and store image from {}: {}", imgUrl, e.getMessage());
            return null;
        }
    }

    private void deleteImageFile(String fileUrl) {
        if (fileUrl == null || fileUrl.isEmpty())
            return;
        try {
            String fileName = fileUrl.substring(fileUrl.lastIndexOf("/") + 1);
            java.nio.file.Path filePath = java.nio.file.Paths.get("uploads").resolve("avalanches").resolve(fileName).normalize();
            java.nio.file.Files.deleteIfExists(filePath);
        } catch (Exception ex) {
            log.error("Failed to delete file: {}", fileUrl, ex);
        }
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

        data.massifName = extractWithRegex(fullText, "(?i)Masiv(?:\\s*muntos)?\\s*:\\s*([^\\*]+)");
        data.zoneDescription = extractWithRegex(fullText, "(?i)Zona\\s*din\\s*masiv\\s*:\\s*([^\\*]+)");
        data.activity = extractWithRegex(fullText, "(?i)Activitate\\s*:\\s*([^\\*]+)");
        data.safetyEquipment = extractWithRegex(fullText, "(?i)Echipament\\s*de\\s*protectie\\s*:\\s*([^\\*]+)");
        data.avalancheType = extractWithRegex(fullText, "(?i)Tipul\\s*avalansei\\s*:\\s*([^\\*]+)");

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

        data.eventTime = extractWithRegex(fullText, "(?i)Ora\\s*:\\s*([^\\*]+)");
        data.orientation = extractWithRegex(fullText, "(?i)Orientarea\\s*pantei\\s*:\\s*([^\\*]+)");

        data.altitude        = parseAverageInt(extractWithRegex(fullText, "(?i)Altitudine\\s*:\\s*([^\\*]+)"));
        data.slopeAngle      = parseAverageInt(extractWithRegex(fullText, "(?i)Inclinatia\\s*pantei\\s*:\\s*([^\\*]+)"));
        data.crownWidth      = parseAverageInt(extractWithRegex(fullText, "(?i)Latimea\\s*coroanei\\s*:\\s*([^\\*]+)"));
        data.accumulationWidth = parseAverageInt(extractWithRegex(fullText, "(?i)(?:Largime|Latime)\\s*zona\\s*de\\s*acumulare\\s*:\\s*([^\\*]+)"));
        data.verticalDrop    = parseAverageInt(extractWithRegex(fullText, "(?i)Diferenta\\s*de\\s*nivel\\s*de\\s*rulare\\s*:\\s*([^\\*]+)"));

        String trackRaw = extractWithRegex(fullText, "(?i)(?:Marimea\\s*avalansei\\s*[^:]*?\\s*)?Relativ\\s*la\\s*urma\\s*:\\s*([^\\*]+)");
        if (trackRaw != null) {
            data.trackLength = parseAverageInt(trackRaw);
            data.relativeSize = trackRaw.trim();
        }

        String crownDepthRaw = extractWithRegex(fullText, "(?i)Adancimea\\s*coroanei(?:\\s*\\(placii\\))?\\s*:\\s*([^\\*]+)");
        if (crownDepthRaw != null) {
            data.crownDepthText = crownDepthRaw.trim();
            data.crownDepth = parseAverageInt(crownDepthRaw);
        }

        String declansareRaw = extractWithRegex(fullText, "(?i)Coordonate\\s*GPS\\s*zona\\s*(?:de\\s*)?declansare\\s*:\\s*([^\\*]+)");
        parseCoordinates(declansareRaw, data, true);

        String acumulareRaw = extractWithRegex(fullText, "(?i)Coordonate\\s*GPS\\s*zona\\s*(?:de\\s*)?acumulare\\s*:\\s*([^\\*]+)");
        parseCoordinates(acumulareRaw, data, false);

        data.personsCaught = extractIntWithRegex(fullText, "(?i)Numar\\s*de\\s*persoane\\s*surprinse\\s*:\\s*([^\\*]+)");
        data.personsPartially = extractIntWithRegex(fullText, "(?i)Numar\\s*de\\s*persoane\\s*acoperite\\s*partial\\s*:\\s*([^\\*]+)");
        data.personsFully = extractIntWithRegex(fullText, "(?i)Numar\\s*de\\s*persoane\\s*acoperite\\s*total\\s*:\\s*([^\\*]+)");
        data.personsInjured = extractIntWithRegex(fullText, "(?i)Numar\\s*de\\s*persoane\\s*accidentate\\s*:\\s*([^\\*]+)");
        data.personsKilled = extractIntWithRegex(fullText, "(?i)Numar\\s*de\\s*persoane\\s*decedate\\s*:\\s*([^\\*]+)");
        data.materialDamage = extractIntWithRegex(fullText, "(?i)Pagube\\s*materiale\\s*:\\s*([^\\*]+)");

        // Extract image URLs
        data.imageUrls = new ArrayList<>();
        for (org.jsoup.nodes.Element img : doc.select("img")) {
            String src = img.absUrl("src");
            if (src == null || src.isEmpty()) {
                src = img.attr("src");
            }
            if (src != null && src.contains("wp-content/uploads") 
                    && !src.contains("logo") && !src.contains("avatar") 
                    && !src.contains("icon") && !src.contains("badge")) {
                if (!data.imageUrls.contains(src)) {
                    data.imageUrls.add(src);
                }
            }
        }

        return data;
    }

    private String extractWithRegex(String text, String regexPattern) {
        java.util.regex.Pattern p = java.util.regex.Pattern.compile(regexPattern);
        java.util.regex.Matcher m = p.matcher(text);
        if (m.find()) {
            return m.group(1).trim();
        }
        return null;
    }

    private Integer extractIntWithRegex(String text, String regexPattern) {
        String raw = extractWithRegex(text, regexPattern);
        return extractIntFromText(raw);
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
        List<String> imageUrls;
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

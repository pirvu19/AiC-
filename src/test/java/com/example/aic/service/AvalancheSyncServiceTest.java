package com.example.aic.service;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class AvalancheSyncServiceTest {

    @Test
    void testParseDocumentWithNoSpacesAndDifferentLabels() {
        String html = "<html><body>" +
                "*Data: 6.12.2025\n" +
                "*Ora: 12:00\n" +
                "*Echipament de protectie: NA\n" +
                "*Coordonate GPS zona declansare: 47.565623, 24.809457\n" +
                "*Coordonate GPS zona acumulare: 47.566615, 24.809970\n" +
                "\n" +
                "*Masiv: M-tii Rodnei\n" +
                "*Zona din masiv: versantul N Creasta principala muntii Rodeni, vest de Varful Gargalau\n" +
                "*Altitudine: 2030m\n" +
                "*Orientarea pantei: N\n" +
                "*Inclinatia pantei: 40*\n" +
                "*Activitate: –\n" +
                "\n" +
                "*Tipul avalansei: avalansa de placa de vant\n" +
                "*Factorul de declansare: spontan\n" +
                "*Marimea avalansei – Relativ la urma: 30m\n" +
                "*Adancimea coroanei: 45cm\n" +
                "*Latimea coroanei: 30m\n" +
                "*Latime zona de acumulare: 15-20m\n" +
                "*Diferenta de nivel de rulare: 20-25m\n" +
                "\n" +
                "* Numar de persoane surprinse :       0\n" +
                "* Numar de persoane acoperite partial : 0\n" +
                "* Numar de persoane acoperite total : 0\n" +
                "* Numar de persoane accidentate : 0\n" +
                "* Numar de persoane decedate : 0\n" +
                "* Pagube materiale: 0\n" +
                "<img src=\"https://avalanseincarpati.ro/wp-content/uploads/2025/09/gargalau.jpg\" />\n" +
                "</body></html>";
        
        Document doc = Jsoup.parse(html);
        // We can pass null dependencies since parseDocument only operates on doc and internal methods
        AvalancheSyncService service = new AvalancheSyncService(null, null, null, null, null, null);
        AvalancheSyncService.ScrapedData data = service.parseDocument(doc);
        
        assertEquals("M-tii Rodnei", data.massifName);
        assertEquals("versantul N Creasta principala muntii Rodeni, vest de Varful Gargalau", data.zoneDescription);
        assertEquals("–", data.activity);
        assertEquals("NA", data.safetyEquipment);
        assertEquals("avalansa de placa de vant", data.avalancheType);
        assertEquals("spontan", data.cause);
        assertEquals("12:00", data.eventTime);
        assertEquals("N", data.orientation);
        assertEquals(2030, data.altitude);
        assertEquals(40, data.slopeAngle);
        assertEquals(30, data.crownWidth);
        assertEquals(17, data.accumulationWidth); // (15 + 20) / 2 = 17
        assertEquals(22, data.verticalDrop); // (20 + 25) / 2 = 22
        assertEquals(30, data.trackLength);
        assertEquals("30m", data.relativeSize);
        assertEquals(45, data.crownDepth);
        assertEquals("45cm", data.crownDepthText);
        assertEquals(47.565623, data.declansareLat);
        assertEquals(24.809457, data.declansareLng);
        assertEquals(47.566615, data.accumLat);
        assertEquals(24.809970, data.accumLng);
        assertEquals(0, data.personsCaught);
        assertEquals(0, data.personsPartially);
        assertEquals(0, data.personsFully);
        assertEquals(0, data.personsInjured);
        assertEquals(0, data.personsKilled);
        assertEquals(0, data.materialDamage);
        
        assertNotNull(data.imageUrls);
        assertEquals(1, data.imageUrls.size());
        assertEquals("https://avalanseincarpati.ro/wp-content/uploads/2025/09/gargalau.jpg", data.imageUrls.get(0));
    }
}

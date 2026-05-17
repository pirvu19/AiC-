package com.example.aic.controller;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Paths;

@RestController
@RequestMapping("/api/meteo")
public class MeteoController {

    @GetMapping(produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> getMeteo() {
        try {
            String pythonCmd = System.getProperty("os.name").toLowerCase().contains("win") ? "python"
                    : "/opt/venv/bin/python3";
            ProcessBuilder pb = new ProcessBuilder(pythonCmd, "-u", "main.py", "--no-browser");
            pb.directory(new File("extragereMeteoAutomatizata"));
            pb.redirectErrorStream(true);
            Process p = pb.start();

            BufferedReader reader = new BufferedReader(new InputStreamReader(p.getInputStream()));
            StringBuilder pythonLog = new StringBuilder();
            String line;
            String htmlPath = null;
            while ((line = reader.readLine()) != null) {
                pythonLog.append(line).append("\n");
                System.out.println("PYTHON: " + line);
                if (line.contains("path_complet:")) {
                    htmlPath = line.substring(line.indexOf("path_complet:") + "path_complet:".length()).trim();
                }
            }
            p.waitFor();

            if (htmlPath != null) {
                String htmlContent = new String(Files.readAllBytes(Paths.get(htmlPath)));
                return ResponseEntity.ok(htmlContent);
            } else {
                return ResponseEntity.internalServerError().body(
                        "<h1>Eroare: Nu s-a putut genera sau gasi raportul meteo.</h1><pre>" + pythonLog.toString() + "</pre>");
            }

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("<h1>Eroare interna server: " + e.getMessage() + "</h1>");
        }
    }

    @GetMapping(value = "/openmeteo", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> getOpenMeteo(@RequestParam double lat, @RequestParam double lng) {
        try {
            String pythonCmd = System.getProperty("os.name").toLowerCase().contains("win") ? "python"
                    : "/opt/venv/bin/python3";
            ProcessBuilder pb = new ProcessBuilder(pythonCmd, "-u", "fetch_openmeteo.py", "--lat", String.valueOf(lat),
                    "--lng", String.valueOf(lng));
            pb.directory(new File("extragereMeteoAutomatizata"));
            pb.redirectErrorStream(true);
            Process p = pb.start();

            BufferedReader reader = new BufferedReader(new InputStreamReader(p.getInputStream()));
            String line;
            String htmlPath = null;
            while ((line = reader.readLine()) != null) {
                System.out.println("PYTHON OPENMETEO: " + line);
                if (line.contains("path_complet:")) {
                    htmlPath = line.substring(line.indexOf("path_complet:") + "path_complet:".length()).trim();
                }
            }
            p.waitFor();

            if (htmlPath != null) {
                String htmlContent = new String(Files.readAllBytes(Paths.get(htmlPath)));
                return ResponseEntity.ok(htmlContent);
            } else {
                return ResponseEntity.internalServerError().body(
                        "<h1>Eroare: Nu s-a putut genera sau gasi raportul meteo. Verificati log-urile serverului.</h1>");
            }

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("<h1>Eroare interna server: " + e.getMessage() + "</h1>");
        }
    }

    @GetMapping(value = "/history", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> getHistory() {
        try {
            String path = "extragereMeteoAutomatizata/istoric_avalanse.json";
            if (Files.exists(Paths.get(path))) {
                String content = new String(Files.readAllBytes(Paths.get(path)));
                return ResponseEntity.ok(content);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    @GetMapping(value = "/chart/{massif}", produces = MediaType.IMAGE_PNG_VALUE)
    public ResponseEntity<byte[]> getChart(@PathVariable String massif) {
        try {
            String pythonCmd = System.getProperty("os.name").toLowerCase().contains("win") ? "python"
                    : "/opt/venv/bin/python3";
            // We use a temporary python script or modify the existing one to output to
            // stdout
            ProcessBuilder pb = new ProcessBuilder(pythonCmd, "-c",
                    "import sys; sys.path.append('.'); from grafice_evolutie import genereaza_grafic_risc_bytes; " +
                            "img = genereaza_grafic_risc_bytes('" + massif + "'); " +
                            "if img: sys.stdout.buffer.write(img)");

            pb.directory(new File("extragereMeteoAutomatizata"));
            Process p = pb.start();

            byte[] imageBytes = p.getInputStream().readAllBytes();
            p.waitFor();

            if (imageBytes.length > 0) {
                return ResponseEntity.ok().contentType(MediaType.IMAGE_PNG).body(imageBytes);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}

package com.example.aic.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;

@Service
public class MeteoCronService {

    // "0 0 9,21 * * ?" se execută zilnic, la ora 09:00:00 și ora 21:00:00.
    @Scheduled(cron = "0 0 9,21 * * ?", zone = "Europe/Bucharest")
    public void runMainPyScriptZilnic() {
        System.out.println(
                "\n[CRON] - " + java.time.LocalDateTime.now() + " -> Se porneste executia programata a main.py...");

        try {
            String pythonCmd = System.getProperty("os.name").toLowerCase().contains("win") ? "python"
                    : "/opt/venv/bin/python3";
            ProcessBuilder pb = new ProcessBuilder(pythonCmd, "-u", "main.py", "--no-browser");
            pb.directory(new File("extragereMeteoAutomatizata"));
            pb.redirectErrorStream(true);
            Process p = pb.start();

            BufferedReader reader = new BufferedReader(new InputStreamReader(p.getInputStream()));
            String line;
            while ((line = reader.readLine()) != null) {
                System.out.println("[PYTHON-CRON] " + line);
            }
            p.waitFor();
            System.out.println("[CRON] - Completat cu succes.\n");

        } catch (Exception e) {
            System.err.println("[CRON] Eroare la executia automata: " + e.getMessage());
            e.printStackTrace();
        }
    }

    @Scheduled(cron = "0 0 8,12,16,20 * * ?", zone = "Europe/Bucharest")
    public void runMeteoRoScript() {
        System.out.println(
                "\n[CRON] - " + java.time.LocalDateTime.now() + " -> Se porneste executia programata a fetch_meteo_ro.py...");

        try {
            String pythonCmd = System.getProperty("os.name").toLowerCase().contains("win") ? "python"
                    : "/opt/venv/bin/python3";
            ProcessBuilder pb = new ProcessBuilder(pythonCmd, "-u", "fetch_meteo_ro.py");
            pb.directory(new File("extragereMeteoAutomatizata"));
            pb.redirectErrorStream(true);
            Process p = pb.start();

            BufferedReader reader = new BufferedReader(new InputStreamReader(p.getInputStream()));
            String line;
            while ((line = reader.readLine()) != null) {
                System.out.println("[PYTHON-CRON METEO-RO] " + line);
            }
            p.waitFor();
            System.out.println("[CRON] - Completat extragerea Meteo RO.\n");

        } catch (Exception e) {
            System.err.println("[CRON] Eroare la executia automata Meteo RO: " + e.getMessage());
            e.printStackTrace();
        }
    }
}

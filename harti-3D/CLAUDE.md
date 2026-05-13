# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the "AiC" (Avalanche in Carpati) project - a data repository focused on avalanche incidents in the Romanian Carpathian Mountains. The project contains historical avalanche data from the website avalanseincarpati.ro.

## Data Structure

The repository contains avalanche incident data in multiple formats:

- **CSV files**: Primary data format containing avalanche incident records
- **Excel files**: Same data in spreadsheet format for easier manual review

### Key Data Files

- `data/avalanse_campuri_RO.csv` - Original avalanche data
- `data/avalanse_campuri_RO_completat.csv` - Completed/processed avalanche data  
- Corresponding `.xlsx` versions of both files

### Data Schema

The avalanche data includes detailed incident information:
- Location data (GPS coordinates, geographic area, mountain range)
- Avalanche characteristics (type, size, trigger factors)
- Physical measurements (elevation, slope orientation, crown depth/width)
- Human impact (casualties, injuries, material damage)
- Safety equipment information
- Links to original reports and images

## Geographic Coverage

Data covers Romanian Carpathian Mountains with categorization by:
- **Meridionali** (Southern Carpathians) - including Fagaras Mountains
- **Orientali** (Eastern Carpathians) 
- **Occidentali** (Western Carpathians)

## Data Processing Notes

- Original data source: avalanseincarpati.ro website
- Data is primarily in Romanian language
- Includes both historical records and recent incidents
- Image links and external references are preserved from original source
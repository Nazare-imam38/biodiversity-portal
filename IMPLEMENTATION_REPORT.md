# Biodiversity Portal Implementation Report

## Overview
Interactive web portal for biodiversity data visualization and analysis across Pakistan's provinces and national level, featuring interactive maps, statistical dashboards, and multi-layer data visualization.

## Core Functionalities

### 1. Interactive Map Visualization
- **Leaflet-based mapping** with zoom, pan, and layer toggling
- **Multi-layer support**: GeoJSON polygons, raster tiles (MBTiles), and WMS services
- **Region-based filtering**: National, Gilgit Baltistan, Punjab, Sindh, Balochistan, KP, AJK
- **Dynamic layer management**: Toggle multiple data layers simultaneously
- **Feature popups**: Click-to-view detailed information for map features

### 2. Data Layers Panel
- **Province-specific layer filtering**: Each region shows only relevant layers
- **Quick Access Featured Layers**: Region-specific quick access to key datasets
- **Layer legends**: Color-coded legends with icons and descriptions
- **Scrollable interface**: Hidden scrollbars with maintained scrolling functionality

### 3. Statistical Dashboard
- **Region-specific statistics cards**: 5-7 key metrics per province
- **Metrics include**: Total area, forest coverage, protected areas, carbon storage, deforestation/enhancement data
- **Visual indicators**: Color-coded cards with icons
- **Real-time updates**: Statistics reflect selected region

### 4. Data Visualization Page
- **Multi-chart analysis**: Bar charts, pie charts, radar charts
- **Layer-based analytics**: 
  - Agroecological Zones distribution
  - Ecoregions by biome
  - Key Biodiversity Areas (KBAs) by area
  - Protected Areas statistics
- **Interactive filtering**: Region-based data filtering
- **Feature highlighting**: Click map features to highlight in charts

## National Level Data

### Available Layers
1. **Pakistan Provincial Boundaries** (GeoJSON)
2. **Agroecological Zones** (GeoJSON) - Agricultural classification zones
3. **Ecoregions 2017** (GeoJSON) - Ecological region classifications
4. **Key Biodiversity Areas** (GeoJSON) - Critical biodiversity sites
5. **Protected Areas (WDPA)** (GeoJSON Point) - World Database on Protected Areas
6. **Protected Areas Polygons** (GeoJSON) - Protected area boundaries
7. **Protected Forest** (GeoJSON) - Forest protection zones
8. **Ramsar Sites** (GeoJSON Point) - Wetland sites of international importance
9. **Pakistan Land Use Land Cover** (Raster Tiles) - National LULC classification
10. **Forest Stratification** (Raster Tiles) - National forest types classification

### Metadata
- **Data Sources**: WDPA, Ramsar Convention, national surveys
- **Coordinate System**: WGS84 (EPSG:4326)
- **Format**: GeoJSON (vector), PNG tiles (raster)
- **Update Frequency**: Varies by dataset

## Provincial Data

### Gilgit Baltistan
**Layers:**
- Provincial boundaries (GeoJSON)
- District boundaries (GeoJSON)
- Land Use Land Cover (Raster tiles)

**Statistics:**
- Total Area: 72,971 sq km
- Forest Area: 329,721 hectares (3.58%)
- Deforestation: 485 hectares
- Enhancement: 2,299 hectares
- Protected Coverage: 56%
- KBA Coverage: 94%
- Carbon Storage: 830,709 Mg/Km²

### Punjab
**Layers:**
- Provincial boundaries (GeoJSON)
- Land Use Land Cover (Raster tiles)
- Wildlife Occurrence (GeoJSON Point) - 303 species presence records

**Statistics:**
- Total Area: 205,344 sq km
- Forest Area: 535,106 hectares (2.6%)
- Deforestation: 7,380 hectares
- Enhancement: 6,774 hectares
- Protected Forest Coverage: 1%
- KBA Coverage: 33%
- Carbon Storage: 310,024,9 Mg/Km²

### Sindh
**Layers:**
- Provincial boundaries (GeoJSON)
- Protected Areas (WDPA) - 31 features (GeoJSON)
- Ramsar Sites (Polygons) (GeoJSON)
- Forest Landscape (GeoJSON)
- Land Use Land Cover (Raster tiles)

**Statistics:**
- Total Area: 14.1 million hectares
- Forest Area: 0.9 million hectares (6.4%)
- Protected Areas: 1.8-2.0 million hectares
- KBA Coverage: 94%
- Ramsar Sites: 6 sites
- Carbon Storage: 1,800,000 Mg/Km²

### Balochistan
**Layers:**
- Provincial boundaries (GeoJSON)
- Land Use Land Cover (Raster tiles)

**Statistics:**
- Total Area: 347,190 sq km
- Rangelands + Forest: 32.3 million hectares
- Woodlands: ~650,000 hectares
- Protected Areas: 1.8-2.0 million hectares
- KBA Coverage: 94%
- Community/Private Reserves: 30,000 hectares
- Ramsar Sites: 6 sites

### Khyber Pakhtunkhwa (KP)
**Layers:**
- Provincial boundaries (GeoJSON)
- Protected Areas - 104 features (GeoJSON)
- Land Use Land Cover (Raster tiles)
- Forest Mask (Raster tiles)

**LULC Legend Colors:**
- Rangeland: #00FF00 (Bright Green)
- Agricultural Land: #FF00FF (Magenta)
- Barren Land: #08aab4 (Cyan/Teal)
- Water Bodies: #0707d8 (Blue)
- Built Up Area: #bced12 (Lime Green)
- Bare Land: #A0522D (Brownish-red)

**Forest Mask:**
- Icon-based display (no detailed legend)
- Raster tile source: KP-Forest-2

### Azad Jammu & Kashmir (AJK)
**Layers:**
- Provincial boundaries (GeoJSON)
- Land Use Land Cover (WMS) - 2016 data
- Forest Mask (WMS) - 2012 data
- Deforestation (WMS) - Final report data

**Statistics:**
- Total Area: 5,134 sq miles
- Forest Area: 591,000 hectares (1.7%)
- Deforestation: 1,046 hectares
- Enhancement: 1,228 hectares
- Wildlife PAs Coverage: 4%

**WMS Services:**
- Server: ajkfmspak.org/geoserver
- Coordinate Systems: EPSG:32643, EPSG:32642

## Technical Implementation

### Frontend
- **Framework**: React.js with React Router
- **Mapping**: Leaflet.js with React-Leaflet
- **Charts**: Recharts library
- **Styling**: Tailwind CSS with custom animations
- **State Management**: React Hooks (useState, useEffect, useMemo)

### Backend
- **Runtime**: Node.js with Express
- **Data Format**: GeoJSON for vector data
- **Tile Services**: MBTiles (PNG tiles) and WMS
- **API Endpoints**: RESTful layer data endpoints

### Data Sources
- **Tile Server**: tiles.dhamarketplace.com
- **WMS Server**: ajkfmspak.org/geoserver
- **International Databases**: WDPA, Ramsar Convention
- **National Surveys**: Provincial forest and land use data

## User Interface Features

### Navigation
- **Responsive Header**: Logo, navigation links, date/time display
- **Region Toggle**: Gradient-styled region selection buttons
- **Mobile Support**: Collapsible mobile menu

### Dashboard
- **Default Region**: KP (Khyber Pakhtunkhwa)
- **Statistics Cards**: Grid layout with responsive columns
- **Map Integration**: Synchronized layer toggling

### Data Visualization
- **Three-Panel Layout**: Left charts (45%), center map (45%), right charts (27.5%)
- **Interactive Charts**: Click-to-filter functionality
- **Fixed Legends**: Map legends remain visible during scroll
- **Gradient UI**: Modern glassmorphism design elements

## Data Access & Filtering

### Region-Based Filtering
- **Automatic Layer Filtering**: Only relevant layers shown per region
- **Backend Compatibility**: Frontend "KP" maps to backend "Khyber Pakhtunkhwa"
- **Boundary Layer Auto-Load**: Provincial boundaries load automatically

### Layer Management
- **Toggle On/Off**: Individual layer control
- **Multiple Layers**: Simultaneous display of multiple layers
- **Opacity Control**: Adjustable layer transparency (raster layers)
- **Legend Display**: Color-coded legends with descriptions

## Performance Optimizations

- **Memoization**: useMemo for computed chart data
- **Lazy Loading**: GeoJSON loaded on demand
- **Tile Caching**: Browser caching for raster tiles
- **Responsive Design**: Mobile-first approach

## Collaboration & Branding

- **Partners**: UNDP Pakistan, Ministry of Climate Change & Environmental Coordination, GEF
- **Logo Links**: Clickable partner logos with respective website URLs
- **Color Scheme**: Green (#16a34a) primary color for collaboration banner

---

**Report Generated**: 2024
**Portal Version**: 1.0
**Last Updated**: Based on current implementation


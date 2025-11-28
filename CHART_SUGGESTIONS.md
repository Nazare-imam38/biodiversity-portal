# Chart & Graph Suggestions for Biodiversity Portal Dashboard

## Overview
This document outlines suggested charts and graphs for visualizing layer data dynamically based on active toggled layers. Charts should update automatically when layers are toggled on/off and when features are clicked.

---

## 1. AGROECOLOGICAL ZONES
**Available Data Fields:** pk_key, pk_name, Area, AreaWise (%), Label

### Suggested Charts:
1. **Pie/Donut Chart - Area Distribution by Zone**
   - **Data:** Zone Name (pk_name) vs Total Area
   - **Purpose:** Show proportional distribution of agroecological zones
   - **Chart Type:** Donut Chart with percentage labels

2. **Bar Chart - Area Percentage by Zone**
   - **Data:** Zone Name (pk_name) vs AreaWise (%)
   - **Purpose:** Compare area percentages across different zones
   - **Chart Type:** Horizontal Bar Chart (sorted by percentage)

3. **Treemap Chart - Zone Area Visualization**
   - **Data:** Zone Name vs Area
   - **Purpose:** Visual representation of relative zone sizes
   - **Chart Type:** Treemap with color intensity based on area

---

## 2. ECOREGIONS
**Available Data Fields:** ECO_NAME, BIOME_NAME, REALM, ECO_BIOME_, NNH_NAME

### Suggested Charts:
1. **Stacked Bar Chart - Ecoregions by Biome**
   - **Data:** BIOME_NAME vs Count of Ecoregions
   - **Purpose:** Show distribution of ecoregions across different biomes
   - **Chart Type:** Stacked Bar Chart

2. **Pie Chart - Realm Distribution**
   - **Data:** REALM vs Count
   - **Purpose:** Show proportional distribution of realms
   - **Chart Type:** Pie Chart with labels

3. **Sunburst Chart - Hierarchical Ecoregion Structure**
   - **Data:** REALM → BIOME_NAME → ECO_NAME
   - **Purpose:** Show hierarchical relationship between realms, biomes, and ecoregions
   - **Chart Type:** Sunburst/Radial Tree Chart

4. **Bar Chart - NNH Status Distribution**
   - **Data:** NNH_NAME vs Count
   - **Purpose:** Show status distribution of ecoregions
   - **Chart Type:** Vertical Bar Chart

---

## 3. KEY BIODIVERSITY AREAS (KBAs)
**Available Data Fields:** NatName, IntName, SitLat, SitLong, SitAreaKM2, KbaStatus, IbaStatus

### Suggested Charts:
1. **Bar Chart - KBA Area Distribution**
   - **Data:** National Name (NatName) vs Area (SitAreaKM2)
   - **Purpose:** Compare sizes of different KBAs
   - **Chart Type:** Horizontal Bar Chart (sorted by area)

2. **Pie Chart - KBA Status Distribution**
   - **Data:** KbaStatus vs Count
   - **Purpose:** Show distribution of KBA statuses
   - **Chart Type:** Pie Chart

3. **Pie Chart - IBA Status Distribution**
   - **Data:** IbaStatus vs Count
   - **Purpose:** Show distribution of IBA statuses
   - **Chart Type:** Pie Chart

4. **Scatter Plot - KBA Geographic Distribution**
   - **Data:** Longitude (SitLong) vs Latitude (SitLat), size by Area
   - **Purpose:** Show geographic spread and size of KBAs
   - **Chart Type:** Scatter Plot with bubble sizes

5. **Treemap - KBA Area Visualization**
   - **Data:** National Name vs Area
   - **Purpose:** Visual representation of KBA sizes
   - **Chart Type:** Treemap

---

## 4. PROTECTED AREAS (WDPA - Points)
**Available Data Fields:** NAME, DESIG, DESIG_ENG, IUCN_CAT, STATUS, STATUS_YR, REP_AREA

### Suggested Charts:
1. **Bar Chart - Protected Areas by IUCN Category**
   - **Data:** IUCN_CAT vs Count
   - **Purpose:** Show distribution across IUCN categories
   - **Chart Type:** Vertical Bar Chart (color-coded by IUCN category)

2. **Pie Chart - Designation Type Distribution**
   - **Data:** DESIG_ENG vs Count
   - **Purpose:** Show distribution of designation types
   - **Chart Type:** Pie Chart

3. **Line Chart - Protected Areas Over Time**
   - **Data:** STATUS_YR vs Count (cumulative)
   - **Purpose:** Show growth of protected areas over time
   - **Chart Type:** Line Chart with area fill

4. **Bar Chart - Total Area by IUCN Category**
   - **Data:** IUCN_CAT vs Sum of REP_AREA
   - **Purpose:** Compare total protected area by category
   - **Chart Type:** Stacked Bar Chart

5. **Pie Chart - Status Distribution**
   - **Data:** STATUS vs Count
   - **Purpose:** Show distribution of protection statuses
   - **Chart Type:** Pie Chart

---

## 5. PROTECTED AREAS (Polygons)
**Available Data Fields:** NAME, DESIG, DESIG_ENG, IUCN_CAT, STATUS, STATUS_YR, GIS_AREA

### Suggested Charts:
1. **Bar Chart - Protected Areas by IUCN Category (Area)**
   - **Data:** IUCN_CAT vs Sum of GIS_AREA
   - **Purpose:** Show total protected area by IUCN category
   - **Chart Type:** Stacked Bar Chart

2. **Line Chart - Protected Area Growth Over Time**
   - **Data:** STATUS_YR vs Cumulative GIS_AREA
   - **Purpose:** Show growth of protected area coverage over time
   - **Chart Type:** Area Chart

3. **Bar Chart - Top 10 Largest Protected Areas**
   - **Data:** NAME vs GIS_AREA (top 10)
   - **Purpose:** Highlight largest protected areas
   - **Chart Type:** Horizontal Bar Chart

4. **Pie Chart - Designation Distribution**
   - **Data:** DESIG_ENG vs Count
   - **Purpose:** Show distribution of designation types
   - **Chart Type:** Pie Chart

---

## 6. PROTECTED FOREST
**Available Data Fields:** F_Zone, F_Circle, F_Div, F_Name, GPS_Area, Gross_Area, F_Type, Legal_Stat

### Suggested Charts:
1. **Bar Chart - Forest Area by Zone**
   - **Data:** F_Zone vs Sum of GPS_Area
   - **Purpose:** Compare forest area across zones
   - **Chart Type:** Vertical Bar Chart

2. **Bar Chart - Forest Area by Circle**
   - **Data:** F_Circle vs Sum of GPS_Area
   - **Purpose:** Compare forest area across circles
   - **Chart Type:** Horizontal Bar Chart

3. **Pie Chart - Forest Type Distribution**
   - **Data:** F_Type vs Count
   - **Purpose:** Show distribution of forest types
   - **Chart Type:** Pie Chart

4. **Bar Chart - Forest Area by Type**
   - **Data:** F_Type vs Sum of GPS_Area
   - **Purpose:** Compare area coverage by forest type
   - **Chart Type:** Stacked Bar Chart

5. **Pie Chart - Legal Status Distribution**
   - **Data:** Legal_Stat vs Count
   - **Purpose:** Show distribution of legal statuses
   - **Chart Type:** Pie Chart

6. **Treemap - Forest Hierarchy Visualization**
   - **Data:** F_Zone → F_Circle → F_Div (with area)
   - **Purpose:** Show hierarchical structure with area sizes
   - **Chart Type:** Treemap

---

## 7. RAMSAR SITES
**Available Data Fields:** Site_name, Region, Country, Designatio, Area__ha_, Latitude, Longitude, Wetland_Ty

### Suggested Charts:
1. **Bar Chart - Ramsar Sites Area by Region**
   - **Data:** Region vs Sum of Area__ha_
   - **Purpose:** Compare wetland area across regions
   - **Chart Type:** Vertical Bar Chart

2. **Pie Chart - Wetland Type Distribution**
   - **Data:** Wetland_Ty vs Count
   - **Purpose:** Show distribution of wetland types
   - **Chart Type:** Pie Chart

3. **Bar Chart - Top 10 Largest Ramsar Sites**
   - **Data:** Site_name vs Area__ha_ (top 10)
   - **Purpose:** Highlight largest Ramsar sites
   - **Chart Type:** Horizontal Bar Chart

4. **Line Chart - Ramsar Site Designation Timeline**
   - **Data:** Designatio (year) vs Count (cumulative)
   - **Purpose:** Show growth of Ramsar site designations over time
   - **Chart Type:** Line Chart with markers

5. **Scatter Plot - Geographic Distribution**
   - **Data:** Longitude vs Latitude, size by Area
   - **Purpose:** Show geographic spread and size of Ramsar sites
   - **Chart Type:** Scatter Plot with bubble sizes

---

## 8. WILDLIFE OCCURRENCE
**Available Data Fields:** Species, Common_nam, X_Longi, Y_Lati

### Suggested Charts:
1. **Bar Chart - Species Occurrence Count**
   - **Data:** Species vs Count of occurrences
   - **Purpose:** Show which species have most occurrence records
   - **Chart Type:** Horizontal Bar Chart (top 20)

2. **Pie Chart - Top 10 Species Distribution**
   - **Data:** Species vs Count (top 10)
   - **Purpose:** Show distribution of most common species
   - **Chart Type:** Pie Chart

3. **Scatter Plot - Species Geographic Distribution**
   - **Data:** Longitude (X_Longi) vs Latitude (Y_Lati), color by Species
   - **Purpose:** Show geographic distribution of different species
   - **Chart Type:** Scatter Plot with color coding

4. **Heatmap - Species Density Map**
   - **Data:** Latitude/Longitude grid with species count
   - **Purpose:** Show density of wildlife occurrences
   - **Chart Type:** Heatmap/Contour Chart

---

## 9. CROSS-LAYER COMPARISON CHARTS
**When Multiple Layers are Active:**

1. **Stacked Area Chart - Protected Area Coverage Comparison**
   - **Data:** Compare Protected Areas, Protected Forest, and Ramsar Sites by area
   - **Purpose:** Show relative coverage of different protection types
   - **Chart Type:** Stacked Area Chart

2. **Grouped Bar Chart - Area Comparison**
   - **Data:** Compare total areas across different layer types
   - **Purpose:** Direct comparison of coverage areas
   - **Chart Type:** Grouped Bar Chart

3. **Venn Diagram - Overlapping Protected Areas**
   - **Data:** Show overlap between Protected Areas, Protected Forest, and KBAs
   - **Purpose:** Visualize spatial relationships
   - **Chart Type:** Venn Diagram or Sankey Diagram

---

## RECOMMENDED CHART LIBRARY
**Suggested Package:** Recharts (React-based, modern, responsive)
- **Alternative:** Chart.js with react-chartjs-2
- **For Advanced:** D3.js for custom visualizations

### Why Recharts?
- Built specifically for React
- Responsive and mobile-friendly
- Good documentation
- Supports all chart types mentioned above
- Easy to customize with Tailwind CSS
- Lightweight and performant

---

## IMPLEMENTATION PRIORITY

### Phase 1 (High Priority):
1. Protected Areas - IUCN Category Distribution
2. Protected Forest - Forest Type Distribution
3. KBAs - Area Distribution
4. Ramsar Sites - Wetland Type Distribution

### Phase 2 (Medium Priority):
1. All Pie Charts for status/type distributions
2. Bar Charts for area comparisons
3. Wildlife Occurrence - Species Count

### Phase 3 (Advanced):
1. Time-series charts (STATUS_YR, Designatio)
2. Geographic scatter plots
3. Treemap visualizations
4. Cross-layer comparison charts

---

## UI/UX CONSIDERATIONS

1. **Placement:** Charts should appear below the Layer Data Dashboard tables
2. **Responsive:** Charts should adapt to mobile/tablet/desktop
3. **Interactive:** Hover tooltips, click to filter, zoom capabilities
4. **Color Scheme:** Match existing green theme (#22c55e, #16a34a)
5. **Loading States:** Show skeleton loaders while data processes
6. **Empty States:** Show friendly messages when no data available
7. **Dynamic Updates:** Charts update automatically when:
   - Layers are toggled on/off
   - Features are clicked/selected
   - Region changes
   - Data filters are applied

---

## DATA PROCESSING NOTES

- Aggregate data at component level using useMemo for performance
- Handle null/undefined values gracefully
- Format numbers with appropriate decimal places
- Sort data appropriately (largest to smallest for bar charts)
- Limit data points for performance (e.g., top 20 for species)
- Cache processed data to avoid recalculation


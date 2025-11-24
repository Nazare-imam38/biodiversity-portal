# Data Directory Setup Guide

This directory contains raster (TIFF) and vector (Shapefile) data that need to be processed before use in the portal.

## Data Files

### Raster Data (TIFF files)
1. **Deforestation**: `Deforestation/Deforestation_updated_v2.tif`
2. **Land Cover**: `Landcover Extent/GB_LULC_2020_Utm43_Final_Report_v5.tif`
3. **Restoration**: `Restoration/Enhancement_updated.tif`

### Vector Data (Shapefile)
1. **Species Distribution**: `Species Distribution/Prersence_points_wildlife_GB.shp`

## Setup Instructions

### Step 1: Convert Shapefile to GeoJSON

Run the conversion script for the species distribution shapefile:

```bash
node scripts/convert-species-distribution.js
```

This will create `geojson/species-distribution.geojson` which will be automatically served by the API.

### Step 2: Generate Raster Tiles (Requires GDAL)

**Prerequisites**: Install GDAL
- **Windows**: Download from https://gdal.org/download.html
- **Mac**: `brew install gdal`
- **Linux**: `sudo apt-get install gdal-bin`

**Generate tiles**:

```bash
node scripts/generate-tiles.js
```

This will:
- Generate tile pyramids for all three TIFF files
- Create tile directories in `tiles/deforestation/`, `tiles/landcover/`, and `tiles/restoration/`
- Tiles will be served automatically from `/tiles/` endpoint

**Note**: Tile generation can take several minutes depending on file size.

### Step 3: Verify Setup

1. **Check GeoJSON file exists**: `geojson/species-distribution.geojson`
2. **Check tile directories exist**: 
   - `tiles/deforestation/`
   - `tiles/landcover/`
   - `tiles/restoration/`

### Step 4: Start the Server

The server is already configured to:
- Serve GeoJSON files from `/geojson/`
- Serve tiles from `/tiles/`
- Include new layers in the API response

Start the server:
```bash
npm start
```

## New Layers Added

The following layers are now available in the portal:

1. **Species Distribution** (Point layer)
   - Type: GeoJSON
   - Icon: Map Marker
   - Color: Red (#ef4444)

2. **Deforestation** (Raster tiles)
   - Type: Raster tiles
   - Icon: Cut/Scissors
   - Color: Red (#dc2626)
   - Opacity: 0.7

3. **Land Cover** (Raster tiles)
   - Type: Raster tiles
   - Icon: Leaf
   - Color: Green (#16a34a)
   - Opacity: 0.7

4. **Restoration** (Raster tiles)
   - Type: Raster tiles
   - Icon: Seedling
   - Color: Green (#22c55e)
   - Opacity: 0.7

## Performance Notes

- **Raster tiles**: Only visible tiles are loaded, providing fast performance even for large datasets
- **GeoJSON**: Loaded once and cached in memory for fast access
- **Tile generation**: One-time process; tiles are pre-rendered and cached

## Troubleshooting

### Tiles not displaying?
- Check that tile directories exist and contain subdirectories (z/x/y structure)
- Verify tiles are accessible at `/tiles/{layer-name}/{z}/{x}/{y}.png`
- Check browser console for 404 errors

### GeoJSON not loading?
- Verify the conversion script ran successfully
- Check that `geojson/species-distribution.geojson` exists
- Check server logs for errors

### GDAL not found?
- Ensure GDAL is installed and in your PATH
- Try running `gdal2tiles.py --version` to verify installation


import shapefile from 'shapefile';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as turf from '@turf/turf';
import proj4 from 'proj4';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define projections
// UTM Zone 43N projection (WGS 1984 UTM Zone 43N)
proj4.defs('EPSG:32643', '+proj=utm +zone=43 +datum=WGS84 +units=m +no_defs');
// Pakistan Albers Equal Area
proj4.defs('EPSG:102025', '+proj=aea +lat_1=23 +lat_2=37 +lat_0=30 +lon_0=69 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs');
// WGS84
proj4.defs('EPSG:4326', '+proj=longlat +datum=WGS84 +no_defs');

// Pakistan bounds for filtering
const PAKISTAN_BOUNDS = {
  minLat: 23.6345,
  maxLat: 37.0841,
  minLng: 60.8742,
  maxLng: 77.8375
};

// Detect projection from coordinate values
function detectProjection(coords) {
  if (Array.isArray(coords[0])) {
    return detectProjection(coords[0]);
  }
  const [x, y] = coords;
  // If already in WGS84 (degrees)
  if (Math.abs(x) <= 180 && Math.abs(y) <= 90) {
    return 'EPSG:4326';
  }
  // Check if it's Pakistan Albers (typically large positive values)
  if (x > 100000 && x < 2000000 && y > 100000 && y < 3000000) {
    return 'EPSG:102025'; // Pakistan Albers
  }
  // Default to UTM Zone 43N
  return 'EPSG:32643';
}

// Transform coordinates to WGS84
function transformCoordinates(coords, fromProj = null, toProj = 'EPSG:4326') {
  if (Array.isArray(coords[0])) {
    return coords.map(c => transformCoordinates(c, fromProj, toProj));
  }
  // Auto-detect projection if not provided
  if (!fromProj) {
    fromProj = detectProjection(coords);
  }
  
  const [x, y] = coords;
  
  // If already in WGS84, return as-is
  if (fromProj === 'EPSG:4326' || (Math.abs(x) <= 180 && Math.abs(y) <= 90)) {
    return coords;
  }
  
  // Transform to WGS84
  try {
    const [lng, lat] = proj4(fromProj, toProj, [x, y]);
    return [lng, lat];
  } catch (e) {
    console.warn(`Transform error for [${x}, ${y}] from ${fromProj}:`, e.message);
    return coords;
  }
}

// Filter features to Pakistan bounds
function filterToPakistanBounds(features) {
  return features.filter(feature => {
    if (!feature.geometry || !feature.geometry.coordinates) {
      return false;
    }
    
    const coords = feature.geometry.coordinates;
    const extractAllCoords = (coordArray) => {
      const allCoords = [];
      const extract = (c) => {
        if (Array.isArray(c[0])) {
          c.forEach(cc => extract(cc));
        } else {
          allCoords.push(c);
        }
      };
      extract(coordArray);
      return allCoords;
    };
    
    const allCoords = extractAllCoords(coords);
    return allCoords.some(coord => {
      const [lng, lat] = coord;
      return lat >= PAKISTAN_BOUNDS.minLat && 
             lat <= PAKISTAN_BOUNDS.maxLat &&
             lng >= PAKISTAN_BOUNDS.minLng && 
             lng <= PAKISTAN_BOUNDS.maxLng;
    });
  });
}

// Convert shapefile to GeoJSON with proper transformation
async function convertShapefileToGeoJSON(shapefilePath, outputPath, projection = null) {
  try {
    console.log(`\nConverting: ${shapefilePath}`);
    const source = await shapefile.open(shapefilePath);
    const features = [];
    let featureCount = 0;
    
    let result = await source.read();
    while (!result.done) {
      if (result.value && result.value.geometry) {
        // Transform coordinates if needed
        const geometry = result.value.geometry;
        if (geometry.coordinates) {
          geometry.coordinates = transformCoordinates(geometry.coordinates, projection);
        }
        features.push(result.value);
        featureCount++;
      }
      result = await source.read();
    }
    
    console.log(`  Read ${featureCount} features`);
    
    // Filter to Pakistan bounds
    const filteredFeatures = filterToPakistanBounds(features);
    console.log(`  Filtered to ${filteredFeatures.length} features within Pakistan bounds`);
    
    const geoJSON = {
      type: 'FeatureCollection',
      features: filteredFeatures
    };
    
    // Write to file
    writeFileSync(outputPath, JSON.stringify(geoJSON, null, 2));
    console.log(`  ✓ Saved to: ${outputPath}`);
    
    return geoJSON;
  } catch (error) {
    console.error(`  ✗ Error converting ${shapefilePath}:`, error.message);
    throw error;
  }
}

// Main conversion function
async function convertAllShapefiles() {
  const baseDir = join(__dirname, '..');
  const geojsonDir = join(baseDir, 'geojson');
  
  // Layer mappings: shapefile path -> geojson filename
  const layerMappings = [
    {
      shp: 'Baseline Data/Agroecological zones/Agroecology.shp',
      geojson: 'agroecological-zones.geojson'
    },
    {
      shp: 'Baseline Data/Ecoregions2017/Ecoregions2017_Pk_project.shp',
      geojson: 'ecoregions.geojson',
      projection: 'EPSG:102025' // Pakistan Albers Equal Area
    },
    {
      shp: 'Baseline Data/KBAs Pakistan/Pakistan_KBA.shp',
      geojson: 'kbas.geojson'
    },
    {
      shp: 'Baseline Data/Protected Areas WDPA pk/Protected_areas_pk.shp',
      geojson: 'protected-areas.geojson'
    },
    {
      shp: 'Baseline Data/Protected Areas WDPA pk/Protected_areas_pol_pk.shp',
      geojson: 'protected-areas-pol.geojson'
    },
    {
      shp: 'Baseline Data/Protected Forest/Protected_forest.shp',
      geojson: 'protected-forest.geojson'
    },
    {
      shp: 'Baseline Data/Ramsar sites pk/Ramsar_sites_pk.shp',
      geojson: 'ramsar-sites.geojson'
    }
  ];
  
  console.log('Starting shapefile to GeoJSON conversion...\n');
  
  for (const mapping of layerMappings) {
    const shpPath = join(baseDir, mapping.shp);
    const geojsonPath = join(geojsonDir, mapping.geojson);
    
    try {
      await convertShapefileToGeoJSON(shpPath, geojsonPath, mapping.projection);
    } catch (error) {
      console.error(`Failed to convert ${mapping.shp}:`, error);
    }
  }
  
  console.log('\n✓ Conversion complete!');
}

// Run conversion
convertAllShapefiles().catch(console.error);


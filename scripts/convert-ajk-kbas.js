import shapefile from 'shapefile';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as turf from '@turf/turf';
import proj4 from 'proj4';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define projections
proj4.defs('EPSG:32643', '+proj=utm +zone=43 +datum=WGS84 +units=m +no_defs');
proj4.defs('EPSG:102025', '+proj=aea +lat_1=23 +lat_2=37 +lat_0=30 +lon_0=69 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs');
proj4.defs('EPSG:4326', '+proj=longlat +datum=WGS84 +no_defs');

// Detect projection from coordinate values
function detectProjection(coords) {
  if (Array.isArray(coords[0])) {
    return detectProjection(coords[0]);
  }
  const [x, y] = coords;
  if (Math.abs(x) <= 180 && Math.abs(y) <= 90) {
    return 'EPSG:4326';
  }
  if (x > 100000 && x < 2000000 && y > 100000 && y < 3000000) {
    return 'EPSG:102025';
  }
  return 'EPSG:32643';
}

// Transform coordinates to WGS84
function transformCoordinates(coords, fromProj = null, toProj = 'EPSG:4326') {
  if (Array.isArray(coords[0])) {
    return coords.map(c => transformCoordinates(c, fromProj, toProj));
  }
  if (!fromProj) {
    fromProj = detectProjection(coords);
  }
  
  const [x, y] = coords;
  
  if (fromProj === 'EPSG:4326' || (Math.abs(x) <= 180 && Math.abs(y) <= 90)) {
    return coords;
  }
  
  try {
    const [lng, lat] = proj4(fromProj, toProj, [x, y]);
    return [lng, lat];
  } catch (e) {
    console.warn(`Transform error for [${x}, ${y}] from ${fromProj}:`, e.message);
    return coords;
  }
}

// Convert shapefile to GeoJSON
async function convertAJKKBAs() {
  try {
    const baseDir = join(__dirname, '..');
    const shapefilePath = join(baseDir, 'Baseline Data', 'Azad Kashmir', 'KBAs', 'AJK_KBAs.shp');
    const outputPath = join(baseDir, 'geojson', 'kbas-ajk.geojson');
    
    console.log(`\nConverting: ${shapefilePath}`);
    console.log(`Output: ${outputPath}\n`);
    
    const source = await shapefile.open(shapefilePath);
    const features = [];
    let featureCount = 0;
    
    let result = await source.read();
    while (!result.done) {
      if (result.value && result.value.geometry) {
        const geometry = result.value.geometry;
        if (geometry.coordinates) {
          geometry.coordinates = transformCoordinates(geometry.coordinates);
        }
        features.push(result.value);
        featureCount++;
      }
      result = await source.read();
    }
    
    console.log(`  Read ${featureCount} features`);
    
    const geoJSON = {
      type: 'FeatureCollection',
      features: features
    };
    
    writeFileSync(outputPath, JSON.stringify(geoJSON, null, 2));
    console.log(`  ✓ Saved ${features.length} features to: ${outputPath}\n`);
    
    return geoJSON;
  } catch (error) {
    console.error(`  ✗ Error:`, error.message);
    throw error;
  }
}

convertAJKKBAs().catch(console.error);


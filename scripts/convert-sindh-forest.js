import shapefile from 'shapefile';
import { writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import proj4 from 'proj4';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define UTM Zone 42N projection (WGS 1984 UTM Zone 42N)
proj4.defs('EPSG:32642', '+proj=utm +zone=42 +datum=WGS84 +units=m +no_defs');
// WGS84
proj4.defs('EPSG:4326', '+proj=longlat +datum=WGS84 +no_defs');

// Transform coordinates from UTM Zone 42N to WGS84
function transformCoordinates(coords) {
  if (Array.isArray(coords[0])) {
    return coords.map(c => transformCoordinates(c));
  }
  
  const [x, y] = coords;
  
  // Check if already in WGS84 (degrees)
  if (Math.abs(x) <= 180 && Math.abs(y) <= 90) {
    return coords;
  }
  
  // Transform from UTM Zone 42N to WGS84
  try {
    const [lng, lat] = proj4('EPSG:32642', 'EPSG:4326', [x, y]);
    return [lng, lat];
  } catch (e) {
    console.warn(`Transform error for [${x}, ${y}]:`, e.message);
    return coords;
  }
}

async function convertSindhForest() {
  try {
    const shapefilePath = join(__dirname, '..', 'Baseline Data', 'Protected Forest', 'SindhForest.shp');
    const outputPath = join(__dirname, '..', 'geojson', 'sindh-forest.geojson');
    
    console.log('Converting Sindh Forest shapefile to GeoJSON...');
    console.log('Input:', shapefilePath);
    console.log('Output:', outputPath);
    console.log('Projection: UTM Zone 42N -> WGS84 (EPSG:4326)');
    
    const source = await shapefile.open(shapefilePath);
    const features = [];
    
    let result = await source.read();
    while (!result.done) {
      if (result.value && result.value.geometry) {
        const feature = { ...result.value };
        
        // Transform coordinates from UTM to WGS84
        if (feature.geometry && feature.geometry.coordinates) {
          feature.geometry.coordinates = transformCoordinates(feature.geometry.coordinates);
        }
        
        features.push(feature);
      }
      result = await source.read();
    }
    
    console.log(`Loaded ${features.length} features from shapefile`);
    
    // Create GeoJSON FeatureCollection
    const geoJSON = {
      type: 'FeatureCollection',
      features: features
    };
    
    // Write to file
    writeFileSync(outputPath, JSON.stringify(geoJSON, null, 2), 'utf8');
    
    console.log(`✅ Successfully converted to GeoJSON: ${outputPath}`);
    console.log(`   Features: ${features.length}`);
    
    // Calculate and display bounds
    if (features.length > 0) {
      const allCoords = [];
      const extractCoords = (coords, depth = 0) => {
        if (depth > 10) return; // Prevent infinite recursion
        if (Array.isArray(coords)) {
          if (coords.length === 2 && typeof coords[0] === 'number' && typeof coords[1] === 'number') {
            allCoords.push(coords);
          } else {
            coords.forEach(c => extractCoords(c, depth + 1));
          }
        }
      };
      
      features.forEach(feature => {
        if (feature.geometry && feature.geometry.coordinates) {
          extractCoords(feature.geometry.coordinates);
        }
      });
      
      if (allCoords.length > 0) {
        const lngs = allCoords.map(c => c[0]).filter(n => !isNaN(n) && Math.abs(n) <= 180);
        const lats = allCoords.map(c => c[1]).filter(n => !isNaN(n) && Math.abs(n) <= 90);
        if (lngs.length > 0 && lats.length > 0) {
          console.log(`   Longitude range: ${Math.min(...lngs).toFixed(4)}°E to ${Math.max(...lngs).toFixed(4)}°E`);
          console.log(`   Latitude range: ${Math.min(...lats).toFixed(4)}°N to ${Math.max(...lats).toFixed(4)}°N`);
          console.log(`   Expected Sindh bounds: ~66.0-71.5°E, 23.0-28.5°N`);
          
          // Check if within Sindh bounds
          const minLng = Math.min(...lngs);
          const maxLng = Math.max(...lngs);
          const minLat = Math.min(...lats);
          const maxLat = Math.max(...lats);
          
          if (minLng >= 66.0 && maxLng <= 71.5 && minLat >= 23.0 && maxLat <= 28.5) {
            console.log(`   ✅ Coordinates are within Sindh province bounds!`);
          } else {
            console.log(`   ⚠️  Coordinates may be outside expected Sindh bounds`);
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error converting shapefile:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

convertSindhForest();


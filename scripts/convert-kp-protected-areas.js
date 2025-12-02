import shapefile from 'shapefile';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import proj4 from 'proj4';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define Everest Lambert Conformal Conic projection
// Based on PA_KP_Official.prj
proj4.defs('EVEREST_LCC', '+proj=lcc +lat_1=29.65555555555556 +lat_2=35.31222222222223 +lat_0=32.5 +lon_0=68.0 +x_0=2743196.4 +y_0=914398.8 +a=6377276.345 +rf=300.8017 +units=m +no_defs');

// WGS84
proj4.defs('EPSG:4326', '+proj=longlat +datum=WGS84 +no_defs');

// Transform coordinates from Everest LCC to WGS84
function transformCoordinates(coords) {
  if (Array.isArray(coords[0])) {
    return coords.map(c => transformCoordinates(c));
  }
  
  const [x, y] = coords;
  
  // Check if already in WGS84 (degrees)
  if (Math.abs(x) <= 180 && Math.abs(y) <= 90) {
    return coords;
  }
  
  // Transform from Everest LCC to WGS84
  try {
    const [lng, lat] = proj4('EVEREST_LCC', 'EPSG:4326', [x, y]);
    return [lng, lat];
  } catch (e) {
    console.warn(`Transform error for [${x}, ${y}]:`, e.message);
    return coords;
  }
}

async function convertKPProtectedAreas() {
  try {
    const baseDir = join(__dirname, '..');
    const shapefilePath = join(baseDir, 'Baseline Data', 'Khyber Pakhtunkhawa', 'KPK Protected Areas', 'PA_KP_Official.shp');
    const outputPath = join(baseDir, 'geojson', 'protected-areas-kp.geojson');
    
    console.log('Converting KPK Protected Areas shapefile to GeoJSON...');
    console.log('Input:', shapefilePath);
    console.log('Output:', outputPath);
    console.log('Projection: Everest Lambert Conformal Conic -> WGS84 (EPSG:4326)');
    
    const source = await shapefile.open(shapefilePath);
    const features = [];
    let featureCount = 0;
    
    let result = await source.read();
    while (!result.done) {
      if (result.value && result.value.geometry) {
        const feature = { ...result.value };
        
        // Transform coordinates from Everest LCC to WGS84
        if (feature.geometry && feature.geometry.coordinates) {
          feature.geometry.coordinates = transformCoordinates(feature.geometry.coordinates);
        }
        
        features.push(feature);
        featureCount++;
      }
      result = await source.read();
    }
    
    console.log(`Loaded ${featureCount} features from shapefile`);
    
    // Create GeoJSON FeatureCollection
    const geoJSON = {
      type: 'FeatureCollection',
      features: features
    };
    
    // Write to file
    writeFileSync(outputPath, JSON.stringify(geoJSON, null, 2), 'utf8');
    
    console.log(`✅ Successfully converted to GeoJSON: ${outputPath}`);
    console.log(`   Features: ${featureCount}`);
    
    if (featureCount > 0) {
      console.log(`   ✅ GeoJSON file created successfully`);
    }
    
  } catch (error) {
    console.error('❌ Error converting shapefile:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

convertKPProtectedAreas();


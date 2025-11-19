import shapefile from 'shapefile';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as turf from '@turf/turf';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function convertShapefileToGeoJSON() {
  try {
    const shapefilePath = join(__dirname, '..', 'Assets', 'pak_admbnda_adm2_wfp_20220909.shp');
    const outputPath = join(__dirname, '..', 'geojson', 'pakistan-provinces.geojson');
    
    console.log('Converting shapefile to GeoJSON...');
    console.log('Input:', shapefilePath);
    console.log('Output:', outputPath);
    
    const source = await shapefile.open(shapefilePath);
    const features = [];
    
    let result = await source.read();
    while (!result.done) {
      if (result.value && result.value.geometry) {
        features.push(result.value);
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
    
    // Calculate bounds (simplified to avoid stack overflow)
    if (features.length > 0) {
      console.log(`   ✅ GeoJSON file created successfully`);
    }
    
  } catch (error) {
    console.error('❌ Error converting shapefile:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

convertShapefileToGeoJSON();


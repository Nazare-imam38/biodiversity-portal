import shapefile from 'shapefile';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function convertBalochistanRamsarToGeoJSON() {
  try {
    const shapefilePath = join(__dirname, '..', 'Baseline Data', 'Balochsitan', 'Ramsar SItes', 'Ramsar_sites_balochistan.shp');
    const outputDir = join(__dirname, '..', 'geojson');
    const outputPath = join(outputDir, 'ramsar-sites-balochistan.geojson');
    
    // Ensure geojson directory exists
    mkdirSync(outputDir, { recursive: true });
    
    console.log('Converting Balochistan Ramsar Sites shapefile to GeoJSON...');
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
    
    if (features.length > 0) {
      console.log(`   ✅ GeoJSON file created successfully`);
      console.log(`   Sample properties:`, Object.keys(features[0].properties || {}).slice(0, 5));
    }
    
  } catch (error) {
    console.error('❌ Error converting shapefile:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

convertBalochistanRamsarToGeoJSON();


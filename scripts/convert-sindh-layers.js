import shapefile from 'shapefile';
import { writeFileSync } from 'fs';
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

async function convertSindhLayers() {
  const baseDir = join(__dirname, '..');
  const geojsonDir = join(baseDir, 'geojson');
  
  // Sindh layer mappings
  const layerMappings = [
    {
      name: 'Sindh Protected Areas (WDPA)',
      shp: 'Baseline Data/Sindh/Sindh DATA/Protected Areas/Sindh_WDPA.shp',
      geojson: 'protected-areas-sindh.geojson'
    },
    {
      name: 'Sindh Ramsar Sites (Polygons)',
      shp: 'Baseline Data/Sindh/Sindh DATA/Ramsar Sites/Ramsar_sites_Sindh_pol.shp',
      geojson: 'ramsar-sites-sindh.geojson'
    },
    {
      name: 'Sindh Forest Landscape',
      shp: 'Baseline Data/Sindh/Sindh DATA/Forest Landscape/SindhForestlandscape.shp',
      geojson: 'forest-landscape-sindh.geojson'
    }
  ];
  
  console.log('Starting Sindh shapefiles to GeoJSON conversion...\n');
  
  for (const mapping of layerMappings) {
    try {
      const shapefilePath = join(baseDir, mapping.shp);
      const outputPath = join(geojsonDir, mapping.geojson);
      
      console.log(`\nConverting: ${mapping.name}`);
      console.log(`Input: ${shapefilePath}`);
      console.log(`Output: ${outputPath}`);
      console.log(`Projection: UTM Zone 42N -> WGS84 (EPSG:4326)`);
      
      const source = await shapefile.open(shapefilePath);
      const features = [];
      let featureCount = 0;
      
      let result = await source.read();
      while (!result.done) {
        if (result.value && result.value.geometry) {
          const feature = { ...result.value };
          
          // Transform coordinates from UTM to WGS84
          if (feature.geometry && feature.geometry.coordinates) {
            feature.geometry.coordinates = transformCoordinates(feature.geometry.coordinates);
          }
          
          features.push(feature);
          featureCount++;
        }
        result = await source.read();
      }
      
      console.log(`  Read ${featureCount} features`);
      
      const geoJSON = {
        type: 'FeatureCollection',
        features: features
      };
      
      // Write to file
      writeFileSync(outputPath, JSON.stringify(geoJSON, null, 2), 'utf8');
      console.log(`  ✓ Saved to: ${outputPath}`);
      console.log(`  ✓ ${mapping.name}: ${featureCount} features`);
      
    } catch (error) {
      console.error(`  ✗ Error converting ${mapping.name}:`, error.message);
      console.error(`  Stack:`, error.stack);
    }
  }
  
  console.log('\n✓ Sindh layers conversion complete!');
}

convertSindhLayers().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});


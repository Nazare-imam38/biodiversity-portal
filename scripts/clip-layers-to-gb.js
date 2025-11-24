import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as turf from '@turf/turf';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Layers to clip (excluding GB-specific layers and pakistan-provinces)
const layersToClip = [
  'agroecological-zones',
  'ecoregions',
  'kbas',
  'protected-areas',
  'protected-areas-pol',
  'protected-forest',
  'ramsar-sites'
];

// Load GB boundary
function loadGBBoundary() {
  const geojsonPath = join(__dirname, '..', 'geojson', 'gb-provincial.geojson');
  
  if (!existsSync(geojsonPath)) {
    throw new Error(`GB provincial GeoJSON not found: ${geojsonPath}`);
  }
  
  const geojsonData = readFileSync(geojsonPath, 'utf8');
  const geoJSON = JSON.parse(geojsonData);
  
  if (!geoJSON || !geoJSON.features || geoJSON.features.length === 0) {
    throw new Error('No features found in GB GeoJSON');
  }
  
  const features = geoJSON.features;
  
  // Create a union of all GB polygons
  let gbUnion = null;
  for (const feature of features) {
    if (feature.geometry && feature.geometry.type === 'Polygon') {
      const polygon = turf.polygon(feature.geometry.coordinates);
      if (!gbUnion) {
        gbUnion = polygon;
      } else {
        try {
          gbUnion = turf.union(gbUnion, polygon);
        } catch (e) {
          console.warn('Error unioning GB polygon:', e.message);
        }
      }
    } else if (feature.geometry && feature.geometry.type === 'MultiPolygon') {
      for (const coords of feature.geometry.coordinates) {
        const polygon = turf.polygon(coords);
        if (!gbUnion) {
          gbUnion = polygon;
        } else {
          try {
            gbUnion = turf.union(gbUnion, polygon);
          } catch (e) {
            console.warn('Error unioning GB MultiPolygon:', e.message);
          }
        }
      }
    }
  }
  
  if (!gbUnion) {
    throw new Error('Failed to create GB boundary union');
  }
  
  return gbUnion;
}

// Clip GeoJSON features to GB boundary
function clipToGB(geoJSON, gbBoundary) {
  if (!gbBoundary || !geoJSON || !geoJSON.features) {
    return geoJSON;
  }
  
  // Get GB bbox for fast filtering
  const gbBbox = turf.bbox(gbBoundary);
  
  const clippedFeatures = [];
  
  for (const feature of geoJSON.features) {
    if (!feature.geometry) continue;
    
    try {
      let clippedFeature = null;
      
      // Fast bbox check first - skip features that are clearly outside GB
      const featureBbox = turf.bbox(feature);
      const bboxOverlaps = !(featureBbox[2] < gbBbox[0] || featureBbox[0] > gbBbox[2] ||
                            featureBbox[3] < gbBbox[1] || featureBbox[1] > gbBbox[3]);
      
      if (!bboxOverlaps) {
        continue; // Skip features outside GB bbox
      }
      
      if (feature.geometry.type === 'Point') {
        // For points, check if they're inside the boundary
        const point = turf.point(feature.geometry.coordinates);
        if (turf.booleanPointInPolygon(point, gbBoundary)) {
          clippedFeature = feature;
        }
      } else if (feature.geometry.type === 'MultiPoint') {
        // For MultiPoint, check each point separately
        const pointsInGB = [];
        for (const coord of feature.geometry.coordinates) {
          const point = turf.point(coord);
          if (turf.booleanPointInPolygon(point, gbBoundary)) {
            pointsInGB.push(coord);
          }
        }
        if (pointsInGB.length > 0) {
          // Create new feature with only points inside GB
          clippedFeature = {
            ...feature,
            geometry: pointsInGB.length === 1
              ? { type: 'Point', coordinates: pointsInGB[0] }
              : { type: 'MultiPoint', coordinates: pointsInGB }
          };
        }
      } else if (feature.geometry.type === 'Polygon') {
        // For polygons, try multiple methods
        const polygonFeature = turf.feature(feature.geometry);
        
        // Method 1: Check if polygon is completely inside GB
        try {
          if (turf.booleanContains(gbBoundary, polygonFeature)) {
            clippedFeature = feature; // Keep entire polygon
          }
        } catch (e) {
          // Continue to next method
        }
        
        // Method 2: Check if polygon intersects GB and get intersection
        if (!clippedFeature) {
          try {
            if (turf.booleanIntersects(polygonFeature, gbBoundary)) {
              const intersection = turf.intersect(polygonFeature, gbBoundary);
              if (intersection && intersection.geometry) {
                clippedFeature = {
                  ...feature,
                  geometry: intersection.geometry
                };
              }
            }
          } catch (e) {
            // Continue to fallback
          }
        }
        
        // Method 3: Fallback - check if centroid is in GB (for features that touch GB)
        if (!clippedFeature) {
          try {
            const centroid = turf.centroid(feature);
            if (turf.booleanPointInPolygon(centroid, gbBoundary)) {
              clippedFeature = feature; // Keep entire feature if centroid is in GB
            }
          } catch (e2) {
            // Skip this feature
          }
        }
      } else if (feature.geometry.type === 'MultiPolygon') {
        // For MultiPolygon, process each polygon separately
        try {
          const intersectedPolygons = [];
          const multiPolygonFeature = turf.feature(feature.geometry);
          
          // Check if entire MultiPolygon is inside GB
          try {
            if (turf.booleanContains(gbBoundary, multiPolygonFeature)) {
              clippedFeature = feature; // Keep entire MultiPolygon
            }
          } catch (e) {
            // Continue to process individual polygons
          }
          
          // Process each polygon in the MultiPolygon
          if (!clippedFeature) {
            for (const polygonCoords of feature.geometry.coordinates) {
              const polygonFeature = turf.polygon(polygonCoords);
              
              // Check if polygon is inside GB
              try {
                if (turf.booleanContains(gbBoundary, polygonFeature)) {
                  intersectedPolygons.push(polygonCoords);
                } else if (turf.booleanIntersects(polygonFeature, gbBoundary)) {
                  const intersection = turf.intersect(polygonFeature, gbBoundary);
                  if (intersection && intersection.geometry) {
                    if (intersection.geometry.type === 'Polygon') {
                      intersectedPolygons.push(intersection.geometry.coordinates);
                    } else if (intersection.geometry.type === 'MultiPolygon') {
                      intersectedPolygons.push(...intersection.geometry.coordinates);
                    }
                  }
                }
              } catch (e) {
                // Try centroid check for this polygon
                try {
                  const polygonFeatureForCentroid = turf.feature({ type: 'Polygon', coordinates: polygonCoords });
                  const centroid = turf.centroid(polygonFeatureForCentroid);
                  if (turf.booleanPointInPolygon(centroid, gbBoundary)) {
                    intersectedPolygons.push(polygonCoords);
                  }
                } catch (e2) {
                  // Skip this polygon
                }
              }
            }
            
            if (intersectedPolygons.length > 0) {
              clippedFeature = {
                ...feature,
                geometry: intersectedPolygons.length === 1 
                  ? { type: 'Polygon', coordinates: intersectedPolygons[0] }
                  : { type: 'MultiPolygon', coordinates: intersectedPolygons }
              };
            }
          }
        } catch (e) {
          // Final fallback: check if centroid is in GB
          try {
            const centroid = turf.centroid(feature);
            if (turf.booleanPointInPolygon(centroid, gbBoundary)) {
              clippedFeature = feature;
            }
          } catch (e2) {
            // Skip this feature
          }
        }
      } else if (feature.geometry.type === 'LineString' || feature.geometry.type === 'MultiLineString') {
        // For lines, check if they intersect the boundary
        try {
          const line = turf.lineString(feature.geometry.coordinates);
          if (turf.booleanIntersects(line, gbBoundary)) {
            // Keep the line if it intersects (simplified approach)
            clippedFeature = feature;
          }
        } catch (e) {
          // Skip this feature
        }
      }
      
      if (clippedFeature) {
        clippedFeatures.push(clippedFeature);
      }
    } catch (error) {
      console.warn(`Error clipping feature: ${error.message}`);
    }
  }
  
  return {
    ...geoJSON,
    features: clippedFeatures
  };
}

// Main function
async function clipAllLayers() {
  console.log('Loading GB boundary...');
  const gbBoundary = loadGBBoundary();
  console.log('✓ GB boundary loaded\n');
  
  const geojsonDir = join(__dirname, '..', 'geojson');
  
  console.log('Clipping layers to GB boundary...\n');
  
  for (const layerId of layersToClip) {
    const inputPath = join(geojsonDir, `${layerId}.geojson`);
    const outputPath = join(geojsonDir, `${layerId}-gb.geojson`);
    
    if (!existsSync(inputPath)) {
      console.warn(`⚠️  Skipping ${layerId}: input file not found`);
      continue;
    }
    
    try {
      console.log(`Processing ${layerId}...`);
      const geojsonData = readFileSync(inputPath, 'utf8');
      const geoJSON = JSON.parse(geojsonData);
      
      const beforeCount = geoJSON.features ? geoJSON.features.length : 0;
      const clipped = clipToGB(geoJSON, gbBoundary);
      const afterCount = clipped.features ? clipped.features.length : 0;
      
      writeFileSync(outputPath, JSON.stringify(clipped, null, 2), 'utf8');
      console.log(`  ✓ ${layerId}: ${beforeCount} -> ${afterCount} features`);
      console.log(`  ✓ Saved to: ${outputPath}\n`);
    } catch (error) {
      console.error(`  ✗ Error processing ${layerId}:`, error.message);
      console.error(`  Stack:`, error.stack);
      console.log('');
    }
  }
  
  console.log('✓ All layers clipped successfully!');
  console.log('\nPre-clipped GB files are ready to use.');
}

// Run the script
clipAllLayers().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});


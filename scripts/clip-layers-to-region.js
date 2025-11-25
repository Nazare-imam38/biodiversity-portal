import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as turf from '@turf/turf';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Layers to clip (excluding region-specific layers and pakistan-provinces)
const layersToClip = [
  'agroecological-zones',
  'ecoregions',
  'kbas',
  'protected-areas',
  'protected-areas-pol',
  'protected-forest',
  'ramsar-sites'
];

// Region configuration
const regions = {
  'Gilgit Baltistan': {
    boundaryFile: 'gb-provincial.geojson',
    suffix: 'gb'
  },
  'Punjab': {
    boundaryFile: 'punjab-provincial.geojson',
    suffix: 'punjab'
  },
  'Sindh': {
    boundaryFile: 'sindh-provincial.geojson',
    suffix: 'sindh'
  },
  'Balochistan': {
    boundaryFile: 'balochistan-provincial.geojson',
    suffix: 'balochistan'
  },
  'Khyber Pakhtunkhwa': {
    boundaryFile: 'kp-provincial.geojson',
    suffix: 'kp'
  },
  'Azad Kashmir': {
    boundaryFile: 'ajk-provincial.geojson',
    suffix: 'ajk'
  }
};

// Load region boundary
function loadRegionBoundary(regionName) {
  const region = regions[regionName];
  if (!region) {
    throw new Error(`Unknown region: ${regionName}`);
  }
  
  const geojsonPath = join(__dirname, '..', 'geojson', region.boundaryFile);
  
  if (!existsSync(geojsonPath)) {
    throw new Error(`${regionName} boundary GeoJSON not found: ${geojsonPath}`);
  }
  
  const geojsonData = readFileSync(geojsonPath, 'utf8');
  const geoJSON = JSON.parse(geojsonData);
  
  if (!geoJSON || !geoJSON.features || geoJSON.features.length === 0) {
    throw new Error(`No features found in ${regionName} GeoJSON`);
  }
  
  const features = geoJSON.features;
  
  // Create a union of all region polygons
  // If there's only one feature and it's a MultiPolygon, use it directly
  if (features.length === 1 && features[0].geometry && features[0].geometry.type === 'MultiPolygon') {
    return turf.multiPolygon(features[0].geometry.coordinates);
  }
  
  // If there's only one feature and it's a Polygon, use it directly
  if (features.length === 1 && features[0].geometry && features[0].geometry.type === 'Polygon') {
    return turf.polygon(features[0].geometry.coordinates);
  }
  
  // For multiple features, create a union
  let regionUnion = null;
  for (const feature of features) {
    if (feature.geometry && feature.geometry.type === 'Polygon') {
      const polygon = turf.polygon(feature.geometry.coordinates);
      if (!regionUnion) {
        regionUnion = polygon;
      } else {
        try {
          regionUnion = turf.union(regionUnion, polygon);
        } catch (e) {
          console.warn(`Error unioning ${regionName} polygon:`, e.message);
        }
      }
    } else if (feature.geometry && feature.geometry.type === 'MultiPolygon') {
      // For MultiPolygon, process each polygon in the MultiPolygon
      for (const polygonCoords of feature.geometry.coordinates) {
        // polygonCoords is an array of LinearRings (first is exterior, rest are holes)
        if (polygonCoords && polygonCoords.length > 0 && polygonCoords[0].length >= 4) {
          const polygon = turf.polygon(polygonCoords);
          if (!regionUnion) {
            regionUnion = polygon;
          } else {
            try {
              regionUnion = turf.union(regionUnion, polygon);
            } catch (e) {
              console.warn(`Error unioning ${regionName} MultiPolygon part:`, e.message);
            }
          }
        }
      }
    }
  }
  
  if (!regionUnion) {
    throw new Error(`Failed to create ${regionName} boundary union`);
  }
  
  return regionUnion;
}

// Clip GeoJSON features to region boundary (generic function)
function clipToRegion(geoJSON, regionBoundary) {
  if (!regionBoundary || !geoJSON || !geoJSON.features) {
    return geoJSON;
  }
  
  // Get region bbox for fast filtering
  const regionBbox = turf.bbox(regionBoundary);
  
  const clippedFeatures = [];
  
  for (const feature of geoJSON.features) {
    if (!feature.geometry) continue;
    
    try {
      let clippedFeature = null;
      
      // Fast bbox check first - skip features that are clearly outside region
      const featureBbox = turf.bbox(feature);
      const bboxOverlaps = !(featureBbox[2] < regionBbox[0] || featureBbox[0] > regionBbox[2] ||
                            featureBbox[3] < regionBbox[1] || featureBbox[1] > regionBbox[3]);
      
      if (!bboxOverlaps) {
        continue; // Skip features outside region bbox
      }
      
      if (feature.geometry.type === 'Point') {
        // For points, check if they're inside the boundary
        const point = turf.point(feature.geometry.coordinates);
        if (turf.booleanPointInPolygon(point, regionBoundary)) {
          clippedFeature = feature;
        }
      } else if (feature.geometry.type === 'MultiPoint') {
        // For MultiPoint, check each point separately
        const pointsInRegion = [];
        for (const coord of feature.geometry.coordinates) {
          const point = turf.point(coord);
          if (turf.booleanPointInPolygon(point, regionBoundary)) {
            pointsInRegion.push(coord);
          }
        }
        if (pointsInRegion.length > 0) {
          // Create new feature with only points inside region
          clippedFeature = {
            ...feature,
            geometry: pointsInRegion.length === 1
              ? { type: 'Point', coordinates: pointsInRegion[0] }
              : { type: 'MultiPoint', coordinates: pointsInRegion }
          };
        }
      } else if (feature.geometry.type === 'Polygon') {
        // For polygons, try multiple methods
        const polygonFeature = turf.feature(feature.geometry);
        
        // Method 1: Check if polygon is completely inside region
        try {
          if (turf.booleanContains(regionBoundary, polygonFeature)) {
            clippedFeature = feature; // Keep entire polygon
          }
        } catch (e) {
          // Continue to next method
        }
        
        // Method 2: Check if polygon intersects region and get intersection
        if (!clippedFeature) {
          try {
            if (turf.booleanIntersects(polygonFeature, regionBoundary)) {
              const intersection = turf.intersect(polygonFeature, regionBoundary);
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
        
        // Method 3: Fallback - check if centroid is in region (for features that touch region)
        if (!clippedFeature) {
          try {
            const centroid = turf.centroid(feature);
            if (turf.booleanPointInPolygon(centroid, regionBoundary)) {
              clippedFeature = feature; // Keep entire feature if centroid is in region
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
          
          // Check if entire MultiPolygon is inside region
          try {
            if (turf.booleanContains(regionBoundary, multiPolygonFeature)) {
              clippedFeature = feature; // Keep entire MultiPolygon
            }
          } catch (e) {
            // Continue to process individual polygons
          }
          
          // Process each polygon in the MultiPolygon
          if (!clippedFeature) {
            for (const polygonCoords of feature.geometry.coordinates) {
              const polygonFeature = turf.polygon(polygonCoords);
              
              // Check if polygon is inside region
              try {
                if (turf.booleanContains(regionBoundary, polygonFeature)) {
                  intersectedPolygons.push(polygonCoords);
                } else if (turf.booleanIntersects(polygonFeature, regionBoundary)) {
                  const intersection = turf.intersect(polygonFeature, regionBoundary);
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
                  if (turf.booleanPointInPolygon(centroid, regionBoundary)) {
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
          // Final fallback: check if centroid is in region
          try {
            const centroid = turf.centroid(feature);
            if (turf.booleanPointInPolygon(centroid, regionBoundary)) {
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
          if (turf.booleanIntersects(line, regionBoundary)) {
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

// Main function to clip layers for a specific region
async function clipLayersForRegion(regionName) {
  const region = regions[regionName];
  if (!region) {
    throw new Error(`Unknown region: ${regionName}. Supported regions: ${Object.keys(regions).join(', ')}`);
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Clipping layers for: ${regionName}`);
  console.log(`${'='.repeat(60)}\n`);
  
  console.log(`Loading ${regionName} boundary...`);
  const regionBoundary = loadRegionBoundary(regionName);
  console.log(`✓ ${regionName} boundary loaded\n`);
  
  const geojsonDir = join(__dirname, '..', 'geojson');
  
  console.log(`Clipping layers to ${regionName} boundary...\n`);
  
  for (const layerId of layersToClip) {
    const inputPath = join(geojsonDir, `${layerId}.geojson`);
    const outputPath = join(geojsonDir, `${layerId}-${region.suffix}.geojson`);
    
    if (!existsSync(inputPath)) {
      console.warn(`⚠️  Skipping ${layerId}: input file not found`);
      continue;
    }
    
    try {
      console.log(`Processing ${layerId}...`);
      const geojsonData = readFileSync(inputPath, 'utf8');
      const geoJSON = JSON.parse(geojsonData);
      
      const beforeCount = geoJSON.features ? geoJSON.features.length : 0;
      const clipped = clipToRegion(geoJSON, regionBoundary);
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
  
  console.log(`✓ All layers clipped successfully for ${regionName}!`);
}

// Main function - clip for all regions or specific region
async function clipAllLayers() {
  const args = process.argv.slice(2);
  const regionArgIndex = args.findIndex(arg => arg.startsWith('--region='));
  
  if (regionArgIndex !== -1) {
    // Clip for specific region
    let regionName = args[regionArgIndex].split('=')[1];
    
    // If the region name has spaces, it might be split across multiple arguments
    // Join all subsequent arguments until we hit another flag or run out
    if (regionArgIndex + 1 < args.length && !args[regionArgIndex + 1].startsWith('--')) {
      // Collect all non-flag arguments after --region=
      const regionParts = [regionName];
      for (let i = regionArgIndex + 1; i < args.length; i++) {
        if (args[i].startsWith('--')) {
          break;
        }
        regionParts.push(args[i]);
      }
      regionName = regionParts.join(' ');
    }
    
    // Remove quotes if present
    regionName = regionName.replace(/^["']|["']$/g, '');
    
    await clipLayersForRegion(regionName);
  } else {
    // Clip for all regions
    for (const regionName of Object.keys(regions)) {
      await clipLayersForRegion(regionName);
    }
    console.log('\n✓ All regions processed successfully!');
    console.log('\nPre-clipped files are ready to use.');
  }
}

// Run the script
clipAllLayers().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});


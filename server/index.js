import express from 'express';
import cors from 'cors';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import shapefile from 'shapefile';
import * as turf from '@turf/turf';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Serve static GeoJSON files
app.use('/geojson', express.static(join(__dirname, '../geojson')));

// Layer configuration with improved colors and types
// Now using GeoJSON files instead of shapefiles for better performance
const layerConfig = {
  'pakistan-provinces': {
    name: 'Pakistan Provinces',
    path: 'Assets/pak_admbnda_adm2_wfp_20220909.shp',
    geojson: null, // Still use shapefile for boundary
    color: '#000000',
    type: 'polygon',
    description: 'Pakistan Provincial Boundaries',
    default: true, // Load by default
    style: {
      fill: false, // Hollow/transparent
      color: '#000000', // Black outline
      weight: 2,
      opacity: 1,
      fillOpacity: 0
    }
  },
  'agroecological-zones': {
    name: 'Agroecological Zones',
    geojson: 'geojson/agroecological-zones.geojson',
    color: '#22c55e',
    type: 'polygon',
    description: 'Agroecological zones of Pakistan'
  },
  'ecoregions': {
    name: 'Ecoregions 2017',
    geojson: 'geojson/ecoregions.geojson',
    color: '#6366f1',
    type: 'polygon',
    description: 'Ecoregions of Pakistan (2017)'
  },
  'kbas': {
    name: 'Key Biodiversity Areas',
    geojson: 'geojson/kbas.geojson',
    color: '#3b82f6',
    type: 'polygon',
    description: 'Key Biodiversity Areas in Pakistan'
  },
  'protected-areas': {
    name: 'Protected Areas (WDPA)',
    geojson: 'geojson/protected-areas.geojson',
    color: '#f59e0b',
    type: 'point',
    description: 'World Database on Protected Areas - Pakistan'
  },
  'protected-areas-pol': {
    name: 'Protected Areas (Polygons)',
    geojson: 'geojson/protected-areas-pol.geojson',
    color: '#8b5cf6',
    type: 'polygon',
    description: 'Protected Areas Polygons'
  },
  'protected-forest': {
    name: 'Protected Forest',
    geojson: 'geojson/protected-forest.geojson',
    color: '#22c55e',
    type: 'polygon',
    description: 'Protected Forest Areas'
  },
  'sindh-forest': {
    name: 'Sindh Forest Landscape',
    geojson: 'geojson/sindh-forest.geojson',
    color: '#10b981',
    type: 'polygon',
    description: 'Sindh Forest Landscape'
  },
  'ramsar-sites': {
    name: 'Ramsar Sites',
    geojson: 'geojson/ramsar-sites.geojson',
    color: '#06b6d4',
    type: 'point',
    description: 'Ramsar Wetland Sites'
  }
};

// Pakistan bounding box for filtering (will be updated from adm2 shapefile)
let PAKISTAN_BOUNDS = {
  minLat: 23.6345,
  maxLat: 37.0841,
  minLng: 60.8742,
  maxLng: 77.8375
};

// Pakistan boundary polygon (from adm2 shapefile) - will be loaded on startup
let PAKISTAN_BOUNDARY = null;

// Cache for processed GeoJSON layers to avoid reprocessing
const layerCache = new Map();

// Load Pakistan boundary from adm2 shapefile
async function loadPakistanBoundary() {
  try {
    const adm2Path = join(__dirname, '..', 'Assets', 'pak_admbnda_adm2_wfp_20220909.shp');
    console.log('Loading Pakistan boundary from adm2 shapefile...');
    const source = await shapefile.open(adm2Path);
    const features = [];
    
    let result = await source.read();
    while (!result.done) {
      if (result.value && result.value.geometry) {
        features.push(result.value);
      }
      result = await source.read();
    }
    
    if (features.length === 0) {
      console.warn('No features found in adm2 shapefile, using default bounds');
      return;
    }
    
    // Create a union of all adm2 polygons to get Pakistan boundary
    let pakistanUnion = null;
    for (const feature of features) {
      if (feature.geometry && feature.geometry.type === 'Polygon') {
        const polygon = turf.polygon(feature.geometry.coordinates);
        if (!pakistanUnion) {
          pakistanUnion = polygon;
        } else {
          try {
            pakistanUnion = turf.union(pakistanUnion, polygon);
          } catch (e) {
            console.warn('Error unioning polygon:', e.message);
          }
        }
      } else if (feature.geometry && feature.geometry.type === 'MultiPolygon') {
        for (const coords of feature.geometry.coordinates) {
          const polygon = turf.polygon(coords);
          if (!pakistanUnion) {
            pakistanUnion = polygon;
          } else {
            try {
              pakistanUnion = turf.union(pakistanUnion, polygon);
            } catch (e) {
              console.warn('Error unioning polygon:', e.message);
            }
          }
        }
      }
    }
    
    if (pakistanUnion) {
      PAKISTAN_BOUNDARY = pakistanUnion;
      const bbox = turf.bbox(pakistanUnion);
      PAKISTAN_BOUNDS = {
        minLng: bbox[0],
        minLat: bbox[1],
        maxLng: bbox[2],
        maxLat: bbox[3]
      };
      console.log('Pakistan boundary loaded successfully');
      console.log(`Pakistan bounds: ${PAKISTAN_BOUNDS.minLat}, ${PAKISTAN_BOUNDS.minLng} to ${PAKISTAN_BOUNDS.maxLat}, ${PAKISTAN_BOUNDS.maxLng}`);
    } else {
      // Fallback: calculate bounds from all features
      const allCoords = [];
      features.forEach(f => {
        if (f.geometry && f.geometry.coordinates) {
          const extractCoords = (coords) => {
            if (Array.isArray(coords[0])) {
              coords.forEach(c => extractCoords(c));
            } else {
              allCoords.push(coords);
            }
          };
          extractCoords(f.geometry.coordinates);
        }
      });
      
      if (allCoords.length > 0) {
        const lats = allCoords.map(c => c[1]);
        const lngs = allCoords.map(c => c[0]);
        PAKISTAN_BOUNDS = {
          minLat: Math.min(...lats),
          maxLat: Math.max(...lats),
          minLng: Math.min(...lngs),
          maxLng: Math.max(...lngs)
        };
        console.log('Pakistan bounds calculated from adm2 features');
        console.log(`Pakistan bounds: ${PAKISTAN_BOUNDS.minLat}, ${PAKISTAN_BOUNDS.minLng} to ${PAKISTAN_BOUNDS.maxLat}, ${PAKISTAN_BOUNDS.maxLng}`);
      }
    }
  } catch (error) {
    console.error('Error loading Pakistan boundary:', error);
    console.log('Using default Pakistan bounds');
  }
}

// Validate coordinates are in valid range (WGS84)
function isValidCoordinate(coordinates) {
  if (Array.isArray(coordinates[0])) {
    // Multi-coordinate array (polygon, line)
    return coordinates.some(coord => isValidCoordinate(coord));
  }
  const [lng, lat] = coordinates;
  // Check if coordinates are in valid WGS84 range
  return typeof lat === 'number' && typeof lng === 'number' &&
         !isNaN(lat) && !isNaN(lng) &&
         lat >= -90 && lat <= 90 &&
         lng >= -180 && lng <= 180;
}

// Check if a coordinate is within Pakistan bounds
function isWithinPakistanBounds(coordinates) {
  if (Array.isArray(coordinates[0])) {
    // Multi-coordinate array (polygon, line)
    return coordinates.some(coord => isWithinPakistanBounds(coord));
  }
  const [lng, lat] = coordinates;
  // First validate coordinates are valid
  if (!isValidCoordinate(coordinates)) {
    return false;
  }
  return lat >= PAKISTAN_BOUNDS.minLat && 
         lat <= PAKISTAN_BOUNDS.maxLat && 
         lng >= PAKISTAN_BOUNDS.minLng && 
         lng <= PAKISTAN_BOUNDS.maxLng;
}

// Filter features to Pakistan bounds (less strict for polygons that might cross boundaries)
function filterToPakistanBounds(features) {
  return features.filter(feature => {
    if (!feature.geometry || !feature.geometry.coordinates) {
      return false;
    }
    
    const coords = feature.geometry.coordinates;
    let hasValidPoint = false;
    let hasValidCoordinate = false;
    
    // First check if coordinates are valid (more lenient - just check if numbers exist)
    const checkValid = (coord) => {
      if (Array.isArray(coord[0])) {
        return coord.some(c => checkValid(c));
      }
      const [lng, lat] = coord;
      return typeof lat === 'number' && typeof lng === 'number' &&
             !isNaN(lat) && !isNaN(lng);
    };
    
    // Handle different geometry types
    if (feature.geometry.type === 'Point') {
      hasValidCoordinate = checkValid(coords);
      if (hasValidCoordinate) {
        hasValidPoint = isWithinPakistanBounds(coords);
      }
    } else if (feature.geometry.type === 'MultiPoint' || 
               feature.geometry.type === 'LineString') {
      hasValidCoordinate = coords.some(coord => checkValid(coord));
      if (hasValidCoordinate) {
        hasValidPoint = coords.some(coord => isWithinPakistanBounds(coord));
      }
    } else if (feature.geometry.type === 'MultiLineString' || 
               feature.geometry.type === 'Polygon') {
      // For polygons, check if at least one point is within bounds
      hasValidCoordinate = coords.some(ring => 
        Array.isArray(ring[0]) 
          ? ring.some(coord => checkValid(coord))
          : checkValid(ring)
      );
      if (hasValidCoordinate) {
        hasValidPoint = coords.some(ring => 
          Array.isArray(ring[0]) 
            ? ring.some(coord => isWithinPakistanBounds(coord))
            : isWithinPakistanBounds(ring)
        );
      }
    } else if (feature.geometry.type === 'MultiPolygon') {
      hasValidCoordinate = coords.some(polygon => 
        polygon.some(ring => 
          Array.isArray(ring[0])
            ? ring.some(coord => checkValid(coord))
            : checkValid(ring)
        )
      );
      if (hasValidCoordinate) {
        hasValidPoint = coords.some(polygon => 
          polygon.some(ring => 
            Array.isArray(ring[0])
              ? ring.some(coord => isWithinPakistanBounds(coord))
              : isWithinPakistanBounds(ring)
          )
        );
      }
    } else {
      // Unknown geometry type, check if coordinates are valid at least
      hasValidCoordinate = checkValid(coords);
      return hasValidCoordinate;
    }
    
    // Only return features with valid coordinates and within bounds
    return hasValidCoordinate && hasValidPoint;
  });
}

// Convert shapefile to GeoJSON
async function convertShapefileToGeoJSON(shapefilePath) {
  try {
    console.log(`Opening shapefile: ${shapefilePath}`);
    const source = await shapefile.open(shapefilePath);
    const features = [];
    let featureCount = 0;
    
    let result = await source.read();
    while (!result.done) {
      if (result.value) {
        if (result.value.geometry) {
          features.push(result.value);
          featureCount++;
        } else {
          console.warn(`Feature ${featureCount} missing geometry:`, result.value);
        }
      }
      result = await source.read();
    }
    
    console.log(`Successfully read ${featureCount} features from ${shapefilePath}`);
    
    // Validate and filter coordinates for ALL layers to prevent covering entire map
    // Even if we don't filter by bounds, we need to validate coordinates are in WGS84
    let finalFeatures = features;
    
    if (features.length > 0) {
      const beforeCount = features.length;
      
      // First, validate coordinates are in WGS84 (degrees, not meters)
      // If coordinates are way outside valid range, they're likely in wrong projection
      const validatedFeatures = features.filter(feature => {
        if (!feature.geometry || !feature.geometry.coordinates) {
          return false;
        }
        
        const coords = feature.geometry.coordinates;
        let hasValidCoord = false;
        
        // Check if coordinates look like WGS84 (degrees) vs projected (meters)
        const checkCoord = (coord) => {
          if (Array.isArray(coord[0])) {
            return coord.some(c => checkCoord(c));
          }
          const [lng, lat] = coord;
          // WGS84 should be: lat -90 to 90, lng -180 to 180
          // If values are much larger, they're likely in meters (projected)
          if (typeof lat === 'number' && typeof lng === 'number' && 
              !isNaN(lat) && !isNaN(lng)) {
            // If coordinates are in reasonable WGS84 range, they're valid
            if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
              return true;
            }
            // If coordinates are huge (like > 1000), they're likely in meters - reject
            if (Math.abs(lat) > 1000 || Math.abs(lng) > 1000) {
              console.warn(`Invalid coordinate detected (likely in wrong projection): [${lat}, ${lng}]`);
              return false;
            }
          }
          return false;
        };
        
        if (feature.geometry.type === 'Point') {
          hasValidCoord = checkCoord(coords);
        } else if (feature.geometry.type === 'MultiPoint' || feature.geometry.type === 'LineString') {
          hasValidCoord = coords.some(coord => checkCoord(coord));
        } else if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiLineString') {
          hasValidCoord = coords.some(ring => 
            Array.isArray(ring[0]) ? ring.some(coord => checkCoord(coord)) : checkCoord(ring)
          );
        } else if (feature.geometry.type === 'MultiPolygon') {
          hasValidCoord = coords.some(polygon => 
            polygon.some(ring => 
              Array.isArray(ring[0]) ? ring.some(coord => checkCoord(coord)) : checkCoord(ring)
            )
          );
        }
        
        return hasValidCoord;
      });
      
      console.log(`Coordinate validation: ${beforeCount} -> ${validatedFeatures.length} features with valid WGS84 coordinates`);
      
      // Log sample coordinates for debugging
      if (validatedFeatures.length > 0 && validatedFeatures.length < beforeCount) {
        const sampleFeature = validatedFeatures[0];
        if (sampleFeature.geometry && sampleFeature.geometry.coordinates) {
          const coords = sampleFeature.geometry.coordinates;
          let sampleCoord = null;
          if (sampleFeature.geometry.type === 'Point') {
            sampleCoord = coords;
          } else if (sampleFeature.geometry.type === 'Polygon' && Array.isArray(coords[0]) && Array.isArray(coords[0][0])) {
            sampleCoord = coords[0][0];
          }
          if (sampleCoord) {
            console.log(`  Sample valid coordinate: [${sampleCoord[1]}, ${sampleCoord[0]}] (lat, lng)`);
          }
        }
        
        // Log an invalid one if we filtered any out
        const invalidFeature = features.find(f => !validatedFeatures.includes(f));
        if (invalidFeature && invalidFeature.geometry && invalidFeature.geometry.coordinates) {
          const coords = invalidFeature.geometry.coordinates;
          let sampleCoord = null;
          if (invalidFeature.geometry.type === 'Point') {
            sampleCoord = coords;
          } else if (invalidFeature.geometry.type === 'Polygon' && Array.isArray(coords[0]) && Array.isArray(coords[0][0])) {
            sampleCoord = coords[0][0];
          }
          if (sampleCoord) {
            console.log(`  Sample invalid coordinate (filtered out): [${sampleCoord[1]}, ${sampleCoord[0]}] (lat, lng)`);
          }
        }
      }
      
      // Clip all layers to Pakistan boundary (except the boundary layer itself)
      // Use fast bounding box filtering first, then simple point-in-polygon for points
      const layerName = shapefilePath.toLowerCase().replace(/\\/g, '/');
      const isBoundaryLayer = layerName.includes('adm2') || layerName.includes('admbnda');
      
      if (!isBoundaryLayer && validatedFeatures.length > 0) {
        // Fast filtering: use bounding box check first, then simple point checks
        // This is much faster than geometric intersection for large datasets
        finalFeatures = validatedFeatures.filter(feature => {
          if (!feature.geometry || !feature.geometry.coordinates) {
            return false;
          }
          
          const coords = feature.geometry.coordinates;
          
          // Fast bounding box check - extract all coordinates and check bounds
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
          
          // Check if any coordinate is within Pakistan bounds
          const hasPointInBounds = allCoords.some(coord => {
            const [lng, lat] = coord;
            return lat >= PAKISTAN_BOUNDS.minLat && 
                   lat <= PAKISTAN_BOUNDS.maxLat &&
                   lng >= PAKISTAN_BOUNDS.minLng && 
                   lng <= PAKISTAN_BOUNDS.maxLng;
          });
          
          // For points, do a more precise check if boundary is loaded
          if (hasPointInBounds && PAKISTAN_BOUNDARY) {
            if (feature.geometry.type === 'Point') {
              const point = turf.point(coords);
              return turf.booleanPointInPolygon(point, PAKISTAN_BOUNDARY);
            } else if (feature.geometry.type === 'MultiPoint') {
              // Check if at least one point is within
              return coords.some(coord => {
                const point = turf.point(coord);
                return turf.booleanPointInPolygon(point, PAKISTAN_BOUNDARY);
              });
            }
            // For polygons/lines, if bbox overlaps, include it (faster than full intersection)
            // The feature might extend slightly beyond but will be mostly within Pakistan
            return true;
          }
          
          return hasPointInBounds;
        });
        
        console.log(`Fast bounds filtering: ${validatedFeatures.length} -> ${finalFeatures.length} features within Pakistan bounds`);
      } else {
        // For boundary layer itself, don't filter
        finalFeatures = validatedFeatures;
      }
    }
    
    const geoJsonResult = {
      type: 'FeatureCollection',
      features: finalFeatures
    };
    
    console.log(`Final GeoJSON for ${shapefilePath}: ${finalFeatures.length} features`);
    
    return geoJsonResult;
  } catch (error) {
    console.error(`Error converting ${shapefilePath}:`, error);
    console.error('Error details:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    throw error;
  }
}

// Get list of available layers
app.get('/api/layers', (req, res) => {
  const layers = Object.keys(layerConfig).map(key => {
    const { style, ...layerWithoutStyle } = layerConfig[key];
    return {
      id: key,
      ...layerWithoutStyle
    };
  });
  res.json(layers);
});

// Get GeoJSON for a specific layer
app.get('/api/layers/:layerId', async (req, res) => {
  const { layerId } = req.params;
  const layer = layerConfig[layerId];
  
  if (!layer) {
    return res.status(404).json({ error: `Layer ${layerId} not found` });
  }
  
  // Check cache first
  if (layerCache.has(layerId)) {
    console.log(`Serving layer ${layerId} from cache`);
    const cached = layerCache.get(layerId);
    return res.json(cached);
  }
  
  console.log(`Requesting layer: ${layerId} (${layer.name})`);
  
  try {
    let geoJSON;
    
    // Use GeoJSON file if available, otherwise convert from shapefile
    if (layer.geojson) {
      const geojsonPath = join(__dirname, '..', layer.geojson);
      console.log(`Loading GeoJSON from: ${geojsonPath}`);
      const { readFileSync } = await import('fs');
      const geojsonData = readFileSync(geojsonPath, 'utf8');
      geoJSON = JSON.parse(geojsonData);
    } else if (layer.path) {
      // Fallback to shapefile conversion for boundary layer
      const shapefilePath = join(__dirname, '..', layer.path);
      console.log(`Loading shapefile from: ${shapefilePath}`);
      geoJSON = await convertShapefileToGeoJSON(shapefilePath);
    } else {
      return res.status(404).json({ error: `No data source found for layer ${layerId}` });
    }
    
    const featureCount = geoJSON.features ? geoJSON.features.length : 0;
    console.log(`Sending GeoJSON for ${layerId}: ${featureCount} features`);
    
    if (featureCount === 0) {
      console.warn(`WARNING: Layer ${layerId} (${layer.name}) has no features!`);
    }
    
    // Cache the result
    layerCache.set(layerId, geoJSON);
    
    res.json(geoJSON);
  } catch (error) {
    console.error(`Error loading layer ${layerId} (${layer.name}):`, error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ error: 'Failed to load layer', details: error.message });
  }
});

// Get Pakistan bounds
app.get('/api/bounds', (req, res) => {
  res.json({
    bounds: PAKISTAN_BOUNDS,
    center: [
      (PAKISTAN_BOUNDS.minLat + PAKISTAN_BOUNDS.maxLat) / 2,
      (PAKISTAN_BOUNDS.minLng + PAKISTAN_BOUNDS.maxLng) / 2
    ]
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Biodiversity Portal API is running' });
});

// Load Pakistan boundary on startup
loadPakistanBoundary().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Biodiversity Portal API server running on http://localhost:${PORT}`);
    console.log(`📊 Available layers: ${Object.keys(layerConfig).length}`);
  });
}).catch((error) => {
  console.error('Error loading Pakistan boundary:', error);
  // Start server anyway with default bounds
  app.listen(PORT, () => {
    console.log(`🚀 Biodiversity Portal API server running on http://localhost:${PORT}`);
    console.log(`📊 Available layers: ${Object.keys(layerConfig).length}`);
    console.log('⚠️  Using default Pakistan bounds');
  });
});


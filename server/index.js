import express from 'express';
import cors from 'cors';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, existsSync } from 'fs';
import shapefile from 'shapefile';
import * as turf from '@turf/turf';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve static GeoJSON files
app.use('/geojson', express.static(join(__dirname, '../geojson')));

// Serve tile directories
app.use('/tiles', express.static(join(__dirname, '../tiles')));

// Layer configuration with improved colors and types
// Now using GeoJSON files instead of shapefiles for better performance
const layerConfig = {
  'pakistan-provinces': {
    name: 'Pakistan District',
    geojson: 'geojson/pakistan-provinces.geojson',
    color: '#000000',
    type: 'polygon',
    description: 'Pakistan District Boundaries',
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
    color: '#f97316',
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
  'ramsar-sites': {
    name: 'Ramsar Sites',
    geojson: 'geojson/ramsar-sites.geojson',
    color: '#06b6d4',
    type: 'point',
    description: 'Ramsar Wetland Sites'
  },
  'gb-provincial': {
    name: 'Gilgit Baltistan Provincial',
    geojson: 'geojson/gb-provincial.geojson',
    color: '#8b5cf6',
    type: 'polygon',
    description: 'Gilgit Baltistan Provincial Boundaries'
  },
  'gb-district': {
    name: 'Gilgit Baltistan District',
    geojson: 'geojson/gb-district.geojson',
    color: '#6366f1',
    type: 'polygon',
    description: 'Gilgit Baltistan District Boundaries'
  },
  'punjab-provincial': {
    name: 'Punjab Provincial',
    geojson: 'geojson/punjab-provincial.geojson',
    color: '#8b5cf6',
    type: 'polygon',
    description: 'Punjab Provincial Boundaries'
  },
  'balochistan-provincial': {
    name: 'Balochistan Provincial',
    geojson: 'geojson/balochistan-provincial.geojson',
    color: '#8b5cf6',
    type: 'polygon',
    description: 'Balochistan Provincial Boundaries'
  },
  'sindh-provincial': {
    name: 'Sindh Provincial',
    geojson: 'geojson/sindh-provincial.geojson',
    color: '#8b5cf6',
    type: 'polygon',
    description: 'Sindh Provincial Boundaries'
  },
  'kp-provincial': {
    name: 'Khyber Pakhtunkhwa Provincial',
    geojson: 'geojson/kp-provincial.geojson',
    color: '#8b5cf6',
    type: 'polygon',
    description: 'Khyber Pakhtunkhwa Provincial Boundaries'
  },
  'ajk-provincial': {
    name: 'Azad Kashmir Provincial',
    geojson: 'geojson/ajk-provincial.geojson',
    color: '#8b5cf6',
    type: 'polygon',
    description: 'Azad Kashmir Provincial Boundaries'
  },
  'wildlife-occurrence': {
    name: 'Wildlife Occurrence',
    geojson: 'geojson/wildlife-occurrence.geojson',
    color: '#ef4444',
    type: 'point',
    description: 'Wildlife Species Presence Points in Punjab (303 records)'
  },
  'punjab-lulc': {
    name: 'Punjab Land Use Land Cover',
    tiles: 'https://tiles.dhamarketplace.com/data/Punjab-LULC/{z}/{x}/{y}.png',
    color: '#22c55e',
    type: 'raster',
    description: 'Punjab Land Use Land Cover Map',
    opacity: 0.9
  },
  'pakistan-lulc': {
    name: 'Pakistan Land Use Land Cover',
    tiles: 'https://tiles.dhamarketplace.com/data/Pakistan-LULC/{z}/{x}/{y}.png',
    color: '#10b981',
    type: 'raster',
    description: 'Pakistan Land Use Land Cover Map',
    opacity: 0.9
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

// Gilgit Baltistan boundary polygon - will be loaded on startup
let GB_BOUNDARY = null;

// Punjab boundary polygon - will be loaded on startup
let PUNJAB_BOUNDARY = null;

// Sindh boundary polygon - will be loaded on startup
let SINDH_BOUNDARY = null;

// Balochistan boundary polygon - will be loaded on startup
let BALOCHISTAN_BOUNDARY = null;

// Khyber Pakhtunkhwa boundary polygon - will be loaded on startup
let KP_BOUNDARY = null;

// Azad Kashmir boundary polygon - will be loaded on startup
let AJK_BOUNDARY = null;

// Cache for processed GeoJSON layers to avoid reprocessing
// Cache key format: "layerId:region" (e.g., "kbas:national" or "kbas:gilgit-baltistan")
const layerCache = new Map();

// Load Punjab boundary from GeoJSON file
async function loadPunjabBoundary() {
  try {
    // Use provincial boundary for clipping
    const geojsonPath = join(__dirname, '..', 'geojson', 'punjab-provincial.geojson');
    console.log('Loading Punjab boundary from GeoJSON...');
    
    if (!existsSync(geojsonPath)) {
      console.warn('Punjab provincial GeoJSON not found, Punjab clipping will be unavailable');
      return;
    }
    
    const geojsonData = readFileSync(geojsonPath, 'utf8');
    const geoJSON = JSON.parse(geojsonData);
    
    if (!geoJSON || !geoJSON.features || geoJSON.features.length === 0) {
      console.warn('No features found in Punjab GeoJSON');
      return;
    }
    
    const features = geoJSON.features;
    
    // Create Punjab boundary - handle single MultiPolygon feature directly
    if (features.length === 1 && features[0].geometry) {
      if (features[0].geometry.type === 'MultiPolygon') {
        PUNJAB_BOUNDARY = turf.multiPolygon(features[0].geometry.coordinates);
        const bbox = turf.bbox(PUNJAB_BOUNDARY);
        console.log('Punjab boundary loaded successfully (using MultiPolygon directly)');
        console.log('Punjab bounds:', {
          minLat: bbox[1],
          maxLat: bbox[3],
          minLng: bbox[0],
          maxLng: bbox[2]
        });
        return;
      } else if (features[0].geometry.type === 'Polygon') {
        PUNJAB_BOUNDARY = turf.polygon(features[0].geometry.coordinates);
        const bbox = turf.bbox(PUNJAB_BOUNDARY);
        console.log('Punjab boundary loaded successfully (using Polygon directly)');
        console.log('Punjab bounds:', {
          minLat: bbox[1],
          maxLat: bbox[3],
          minLng: bbox[0],
          maxLng: bbox[2]
        });
        return;
      }
    }
    
    // For multiple features, create a union
    let punjabUnion = null;
    for (const feature of features) {
      if (feature.geometry && feature.geometry.type === 'Polygon') {
        const polygon = turf.polygon(feature.geometry.coordinates);
        if (!punjabUnion) {
          punjabUnion = polygon;
        } else {
          try {
            punjabUnion = turf.union(punjabUnion, polygon);
          } catch (e) {
            console.warn('Error unioning Punjab polygon:', e.message);
          }
        }
      } else if (feature.geometry && feature.geometry.type === 'MultiPolygon') {
        for (const coords of feature.geometry.coordinates) {
          if (coords && coords.length > 0 && coords[0].length >= 4) {
            const polygon = turf.polygon(coords);
            if (!punjabUnion) {
              punjabUnion = polygon;
            } else {
              try {
                punjabUnion = turf.union(punjabUnion, polygon);
              } catch (e) {
                console.warn('Error unioning Punjab MultiPolygon:', e.message);
              }
            }
          }
        }
      }
    }
    
    if (punjabUnion) {
      PUNJAB_BOUNDARY = punjabUnion;
      const bbox = turf.bbox(punjabUnion);
      console.log('Punjab boundary loaded successfully');
      console.log('Punjab bounds:', {
        minLat: bbox[1],
        maxLat: bbox[3],
        minLng: bbox[0],
        maxLng: bbox[2]
      });
    } else {
      console.warn('Failed to create Punjab boundary union');
    }
  } catch (error) {
    console.error('Error loading Punjab boundary:', error);
  }
}

// Load Sindh boundary from GeoJSON file
async function loadSindhBoundary() {
  try {
    const geojsonPath = join(__dirname, '..', 'geojson', 'sindh-provincial.geojson');
    console.log('Loading Sindh boundary from GeoJSON...');

    if (!existsSync(geojsonPath)) {
      console.warn('Sindh provincial GeoJSON not found, Sindh clipping will be unavailable');
      return;
    }

    const geojsonData = readFileSync(geojsonPath, 'utf8');
    const geoJSON = JSON.parse(geojsonData);

    if (!geoJSON || !geoJSON.features || geoJSON.features.length === 0) {
      console.warn('No features found in Sindh GeoJSON');
      return;
    }

    const features = geoJSON.features;

    if (features.length === 1 && features[0].geometry) {
      if (features[0].geometry.type === 'MultiPolygon') {
        SINDH_BOUNDARY = turf.multiPolygon(features[0].geometry.coordinates);
        const bbox = turf.bbox(SINDH_BOUNDARY);
        console.log('Sindh boundary loaded successfully (using MultiPolygon directly)');
        console.log('Sindh bounds:', {
          minLat: bbox[1],
          maxLat: bbox[3],
          minLng: bbox[0],
          maxLng: bbox[2]
        });
        return;
      } else if (features[0].geometry.type === 'Polygon') {
        SINDH_BOUNDARY = turf.polygon(features[0].geometry.coordinates);
        const bbox = turf.bbox(SINDH_BOUNDARY);
        console.log('Sindh boundary loaded successfully (using Polygon directly)');
        console.log('Sindh bounds:', {
          minLat: bbox[1],
          maxLat: bbox[3],
          minLng: bbox[0],
          maxLng: bbox[2]
        });
        return;
      }
    }

    let sindhUnion = null;
    for (const feature of features) {
      if (feature.geometry && feature.geometry.type === 'Polygon') {
        const polygon = turf.polygon(feature.geometry.coordinates);
        if (!sindhUnion) {
          sindhUnion = polygon;
        } else {
          try {
            sindhUnion = turf.union(sindhUnion, polygon);
          } catch (e) {
            console.warn('Error unioning Sindh polygon:', e.message);
          }
        }
      } else if (feature.geometry && feature.geometry.type === 'MultiPolygon') {
        for (const coords of feature.geometry.coordinates) {
          const polygon = turf.polygon(coords);
          if (!sindhUnion) {
            sindhUnion = polygon;
          } else {
            try {
              sindhUnion = turf.union(sindhUnion, polygon);
            } catch (e) {
              console.warn('Error unioning Sindh MultiPolygon:', e.message);
            }
          }
        }
      }
    }

    if (sindhUnion) {
      SINDH_BOUNDARY = sindhUnion;
      const bbox = turf.bbox(sindhUnion);
      console.log('Sindh boundary loaded successfully');
      console.log('Sindh bounds:', {
        minLat: bbox[1],
        maxLat: bbox[3],
        minLng: bbox[0],
        maxLng: bbox[2]
      });
    } else {
      console.warn('Failed to create Sindh boundary union');
    }
  } catch (error) {
    console.error('Error loading Sindh boundary:', error);
  }
}

// Load Balochistan boundary from GeoJSON file
async function loadBalochistanBoundary() {
  try {
    // Use provincial boundary for clipping
    const geojsonPath = join(__dirname, '..', 'geojson', 'balochistan-provincial.geojson');
    console.log('Loading Balochistan boundary from GeoJSON...');
    
    if (!existsSync(geojsonPath)) {
      console.warn('Balochistan provincial GeoJSON not found, Balochistan clipping will be unavailable');
      return;
    }
    
    const geojsonData = readFileSync(geojsonPath, 'utf8');
    const geoJSON = JSON.parse(geojsonData);
    
    if (!geoJSON || !geoJSON.features || geoJSON.features.length === 0) {
      console.warn('No features found in Balochistan GeoJSON');
      return;
    }
    
    const features = geoJSON.features;
    
    // Create Balochistan boundary - handle single MultiPolygon feature directly
    if (features.length === 1 && features[0].geometry) {
      if (features[0].geometry.type === 'MultiPolygon') {
        BALOCHISTAN_BOUNDARY = turf.multiPolygon(features[0].geometry.coordinates);
        const bbox = turf.bbox(BALOCHISTAN_BOUNDARY);
        console.log('Balochistan boundary loaded successfully (using MultiPolygon directly)');
        console.log('Balochistan bounds:', {
          minLat: bbox[1],
          maxLat: bbox[3],
          minLng: bbox[0],
          maxLng: bbox[2]
        });
        return;
      } else if (features[0].geometry.type === 'Polygon') {
        BALOCHISTAN_BOUNDARY = turf.polygon(features[0].geometry.coordinates);
        const bbox = turf.bbox(BALOCHISTAN_BOUNDARY);
        console.log('Balochistan boundary loaded successfully (using Polygon directly)');
        console.log('Balochistan bounds:', {
          minLat: bbox[1],
          maxLat: bbox[3],
          minLng: bbox[0],
          maxLng: bbox[2]
        });
        return;
      }
    }
    
    // For multiple features, create a union
    let balochistanUnion = null;
    for (const feature of features) {
      if (feature.geometry && feature.geometry.type === 'Polygon') {
        const polygon = turf.polygon(feature.geometry.coordinates);
        if (!balochistanUnion) {
          balochistanUnion = polygon;
        } else {
          try {
            balochistanUnion = turf.union(balochistanUnion, polygon);
          } catch (e) {
            console.warn('Error unioning Balochistan polygon:', e.message);
          }
        }
      } else if (feature.geometry && feature.geometry.type === 'MultiPolygon') {
        for (const coords of feature.geometry.coordinates) {
          const polygon = turf.polygon(coords);
          if (!balochistanUnion) {
            balochistanUnion = polygon;
          } else {
            try {
              balochistanUnion = turf.union(balochistanUnion, polygon);
            } catch (e) {
              console.warn('Error unioning Balochistan MultiPolygon:', e.message);
            }
          }
        }
      }
    }
    
    if (balochistanUnion) {
      BALOCHISTAN_BOUNDARY = balochistanUnion;
      const bbox = turf.bbox(balochistanUnion);
      console.log('Balochistan boundary loaded successfully');
      console.log('Balochistan bounds:', {
        minLat: bbox[1],
        maxLat: bbox[3],
        minLng: bbox[0],
        maxLng: bbox[2]
      });
    } else {
      console.warn('Failed to create Balochistan boundary union');
    }
  } catch (error) {
    console.error('Error loading Balochistan boundary:', error);
  }
}

// Load Khyber Pakhtunkhwa boundary from GeoJSON file
async function loadKPBoundary() {
  try {
    // Use provincial boundary for clipping
    const geojsonPath = join(__dirname, '..', 'geojson', 'kp-provincial.geojson');
    console.log('Loading Khyber Pakhtunkhwa boundary from GeoJSON...');
    
    if (!existsSync(geojsonPath)) {
      console.warn('KP provincial GeoJSON not found, KP clipping will be unavailable');
      return;
    }
    
    const geojsonData = readFileSync(geojsonPath, 'utf8');
    const geoJSON = JSON.parse(geojsonData);
    
    if (!geoJSON || !geoJSON.features || geoJSON.features.length === 0) {
      console.warn('No features found in KP GeoJSON');
      return;
    }
    
    const features = geoJSON.features;
    
    // Create KP boundary - handle single MultiPolygon feature directly
    if (features.length === 1 && features[0].geometry) {
      if (features[0].geometry.type === 'MultiPolygon') {
        KP_BOUNDARY = turf.multiPolygon(features[0].geometry.coordinates);
        const bbox = turf.bbox(KP_BOUNDARY);
        console.log('KP boundary loaded successfully (using MultiPolygon directly)');
        console.log('KP bounds:', {
          minLat: bbox[1],
          maxLat: bbox[3],
          minLng: bbox[0],
          maxLng: bbox[2]
        });
        return;
      } else if (features[0].geometry.type === 'Polygon') {
        KP_BOUNDARY = turf.polygon(features[0].geometry.coordinates);
        const bbox = turf.bbox(KP_BOUNDARY);
        console.log('KP boundary loaded successfully (using Polygon directly)');
        console.log('KP bounds:', {
          minLat: bbox[1],
          maxLat: bbox[3],
          minLng: bbox[0],
          maxLng: bbox[2]
        });
        return;
      }
    }
    
    // For multiple features, create a union
    let kpUnion = null;
    for (const feature of features) {
      if (feature.geometry && feature.geometry.type === 'Polygon') {
        const polygon = turf.polygon(feature.geometry.coordinates);
        if (!kpUnion) {
          kpUnion = polygon;
        } else {
          try {
            kpUnion = turf.union(kpUnion, polygon);
          } catch (e) {
            console.warn('Error unioning KP polygon:', e.message);
          }
        }
      } else if (feature.geometry && feature.geometry.type === 'MultiPolygon') {
        for (const coords of feature.geometry.coordinates) {
          const polygon = turf.polygon(coords);
          if (!kpUnion) {
            kpUnion = polygon;
          } else {
            try {
              kpUnion = turf.union(kpUnion, polygon);
            } catch (e) {
              console.warn('Error unioning KP MultiPolygon:', e.message);
            }
          }
        }
      }
    }
    
    if (kpUnion) {
      KP_BOUNDARY = kpUnion;
      const bbox = turf.bbox(kpUnion);
      console.log('KP boundary loaded successfully');
      console.log('KP bounds:', {
        minLat: bbox[1],
        maxLat: bbox[3],
        minLng: bbox[0],
        maxLng: bbox[2]
      });
    } else {
      console.warn('Failed to create KP boundary union');
    }
  } catch (error) {
    console.error('Error loading KP boundary:', error);
  }
}

// Load Azad Kashmir boundary from GeoJSON file
async function loadAJKBoundary() {
  try {
    // Use provincial boundary for clipping
    const geojsonPath = join(__dirname, '..', 'geojson', 'ajk-provincial.geojson');
    console.log('Loading Azad Kashmir boundary from GeoJSON...');
    
    if (!existsSync(geojsonPath)) {
      console.warn('AJK provincial GeoJSON not found, AJK clipping will be unavailable');
      return;
    }
    
    const geojsonData = readFileSync(geojsonPath, 'utf8');
    const geoJSON = JSON.parse(geojsonData);
    
    if (!geoJSON || !geoJSON.features || geoJSON.features.length === 0) {
      console.warn('No features found in AJK GeoJSON');
      return;
    }
    
    const features = geoJSON.features;
    
    // Create AJK boundary - handle single MultiPolygon feature directly
    if (features.length === 1 && features[0].geometry) {
      if (features[0].geometry.type === 'MultiPolygon') {
        AJK_BOUNDARY = turf.multiPolygon(features[0].geometry.coordinates);
        const bbox = turf.bbox(AJK_BOUNDARY);
        console.log('AJK boundary loaded successfully (using MultiPolygon directly)');
        console.log('AJK bounds:', {
          minLat: bbox[1],
          maxLat: bbox[3],
          minLng: bbox[0],
          maxLng: bbox[2]
        });
        return;
      } else if (features[0].geometry.type === 'Polygon') {
        AJK_BOUNDARY = turf.polygon(features[0].geometry.coordinates);
        const bbox = turf.bbox(AJK_BOUNDARY);
        console.log('AJK boundary loaded successfully (using Polygon directly)');
        console.log('AJK bounds:', {
          minLat: bbox[1],
          maxLat: bbox[3],
          minLng: bbox[0],
          maxLng: bbox[2]
        });
        return;
      }
    }
    
    // For multiple features, create a union
    let ajkUnion = null;
    for (const feature of features) {
      if (feature.geometry && feature.geometry.type === 'Polygon') {
        const polygon = turf.polygon(feature.geometry.coordinates);
        if (!ajkUnion) {
          ajkUnion = polygon;
        } else {
          try {
            ajkUnion = turf.union(ajkUnion, polygon);
          } catch (e) {
            console.warn('Error unioning AJK polygon:', e.message);
          }
        }
      } else if (feature.geometry && feature.geometry.type === 'MultiPolygon') {
        for (const coords of feature.geometry.coordinates) {
          const polygon = turf.polygon(coords);
          if (!ajkUnion) {
            ajkUnion = polygon;
          } else {
            try {
              ajkUnion = turf.union(ajkUnion, polygon);
            } catch (e) {
              console.warn('Error unioning AJK MultiPolygon:', e.message);
            }
          }
        }
      }
    }
    
    if (ajkUnion) {
      AJK_BOUNDARY = ajkUnion;
      const bbox = turf.bbox(ajkUnion);
      console.log('AJK boundary loaded successfully');
      console.log('AJK bounds:', {
        minLat: bbox[1],
        maxLat: bbox[3],
        minLng: bbox[0],
        maxLng: bbox[2]
      });
    } else {
      console.warn('Failed to create AJK boundary union');
    }
  } catch (error) {
    console.error('Error loading AJK boundary:', error);
  }
}

// Load Gilgit Baltistan boundary from GeoJSON file
async function loadGBBoundary() {
  try {
    // Use provincial boundary for clipping (more accurate than district)
    const geojsonPath = join(__dirname, '..', 'geojson', 'gb-provincial.geojson');
    console.log('Loading Gilgit Baltistan boundary from GeoJSON...');
    
    if (!existsSync(geojsonPath)) {
      console.warn('GB provincial GeoJSON not found, GB clipping will be unavailable');
      return;
    }
    
    const geojsonData = readFileSync(geojsonPath, 'utf8');
    const geoJSON = JSON.parse(geojsonData);
    
    if (!geoJSON || !geoJSON.features || geoJSON.features.length === 0) {
      console.warn('No features found in GB GeoJSON');
      return;
    }
    
    const features = geoJSON.features;
    
    // Create a union of all GB polygons to get GB boundary
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
    
    if (gbUnion) {
      GB_BOUNDARY = gbUnion;
      const bbox = turf.bbox(gbUnion);
      console.log('GB boundary loaded successfully');
      console.log('GB bounds:', {
        minLat: bbox[1],
        maxLat: bbox[3],
        minLng: bbox[0],
        maxLng: bbox[2]
      });
    } else {
      console.warn('Failed to create GB boundary union');
    }
  } catch (error) {
    console.error('Error loading GB boundary:', error);
  }
}

// Load Pakistan boundary from GeoJSON file
async function loadPakistanBoundary() {
  try {
    const geojsonPath = join(__dirname, '..', 'geojson', 'pakistan-provinces.geojson');
    console.log('Loading Pakistan boundary from GeoJSON...');
    
    if (!existsSync(geojsonPath)) {
      console.warn('Pakistan provinces GeoJSON not found, using default bounds');
      return;
    }
    
    const geojsonData = readFileSync(geojsonPath, 'utf8');
    const geoJSON = JSON.parse(geojsonData);
    
    if (!geoJSON || !geoJSON.features || geoJSON.features.length === 0) {
      console.warn('No features found in GeoJSON, using default bounds');
      return;
    }
    
    const features = geoJSON.features;
    
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

// Clip GeoJSON features to a boundary polygon
function clipToBoundary(geoJSON, boundary) {
  if (!boundary || !geoJSON || !geoJSON.features) {
    return geoJSON;
  }
  
  const clippedFeatures = [];
  
  for (const feature of geoJSON.features) {
    if (!feature.geometry) continue;
    
    try {
      let clippedFeature = null;
      
      if (feature.geometry.type === 'Point') {
        // For points, check if they're inside the boundary
        const point = turf.point(feature.geometry.coordinates);
        if (turf.booleanPointInPolygon(point, boundary)) {
          clippedFeature = feature;
        }
      } else if (feature.geometry.type === 'Polygon') {
        // For polygons, use intersect
        try {
          const polygon = turf.polygon(feature.geometry.coordinates);
          const intersection = turf.intersect(polygon, boundary);
          if (intersection && intersection.geometry) {
            clippedFeature = {
              ...feature,
              geometry: intersection.geometry
            };
          }
        } catch (e) {
          console.warn(`Error intersecting polygon: ${e.message}`);
        }
      } else if (feature.geometry.type === 'MultiPolygon') {
        // For MultiPolygon, intersect each polygon separately
        try {
          const multiPolygon = turf.multiPolygon(feature.geometry.coordinates);
          const intersection = turf.intersect(multiPolygon, boundary);
          if (intersection && intersection.geometry) {
            clippedFeature = {
              ...feature,
              geometry: intersection.geometry
            };
          }
        } catch (e) {
          // Fallback: try intersecting each polygon individually
          try {
            const intersectedPolygons = [];
            for (const polygonCoords of feature.geometry.coordinates) {
              const polygon = turf.polygon(polygonCoords);
              const intersection = turf.intersect(polygon, boundary);
              if (intersection && intersection.geometry) {
                if (intersection.geometry.type === 'Polygon') {
                  intersectedPolygons.push(intersection.geometry.coordinates);
                } else if (intersection.geometry.type === 'MultiPolygon') {
                  intersectedPolygons.push(...intersection.geometry.coordinates);
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
          } catch (e2) {
            console.warn(`Error intersecting MultiPolygon: ${e2.message}`);
          }
        }
      } else if (feature.geometry.type === 'LineString' || feature.geometry.type === 'MultiLineString') {
        // For lines, check if they intersect the boundary
        try {
          const line = turf.lineString(feature.geometry.coordinates);
          const intersection = turf.lineIntersect(line, boundary);
          if (intersection && intersection.features && intersection.features.length > 0) {
            // Keep the line if it intersects (simplified approach)
            clippedFeature = feature;
          }
        } catch (e) {
          console.warn(`Error clipping line: ${e.message}`);
        }
      }
      
      if (clippedFeature) {
        clippedFeatures.push(clippedFeature);
      }
    } catch (error) {
      console.warn(`Error clipping feature: ${error.message}`);
      // Skip this feature if clipping fails
    }
  }
  
  return {
    ...geoJSON,
    features: clippedFeatures
  };
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
  try {
  const layers = Object.keys(layerConfig).map(key => {
      try {
        const layer = layerConfig[key];
        const { style, ...layerWithoutStyle } = layer;
    const layerData = {
      id: key,
      ...layerWithoutStyle
    };
    
    // Log LULC layers for debugging
    if (key === 'punjab-lulc' || key === 'pakistan-lulc') {
      console.log(`Serving ${key} with tiles URL:`, layerData.tiles);
    }
    
    return layerData;
      } catch (layerError) {
        console.error(`Error processing layer ${key}:`, layerError);
        // Return a minimal layer object even if there's an error
        return {
          id: key,
          name: layerConfig[key]?.name || key,
          error: 'Layer configuration error'
        };
      }
  });
  res.json(layers);
  } catch (error) {
    console.error('Error in /api/layers:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ error: 'Failed to get layers', details: error.message });
  }
});

// Get GeoJSON for a specific layer
app.get('/api/layers/:layerId', async (req, res) => {
  const { layerId } = req.params;
  const { region = 'National' } = req.query; // Get region from query parameter
  const layer = layerConfig[layerId];
  
  if (!layer) {
    return res.status(404).json({ error: `Layer ${layerId} not found` });
  }
  
  // Create cache key with region
  const cacheKey = `${layerId}:${region}`;
  
  // Check cache first
  if (layerCache.has(cacheKey)) {
    console.log(`Serving layer ${layerId} (${region}) from cache`);
    const cached = layerCache.get(cacheKey);
    return res.json(cached);
  }
  
  console.log(`Requesting layer: ${layerId} (${layer.name}) for region: ${region}`);
  
  try {
    // Handle raster layers (they don't have GeoJSON data)
    if (layer.type === 'raster') {
      console.log(`Layer ${layerId} is a raster layer, returning empty GeoJSON`);
      const emptyGeoJSON = {
        type: 'FeatureCollection',
        features: []
      };
      // Cache the result
      layerCache.set(cacheKey, emptyGeoJSON);
      return res.json(emptyGeoJSON);
    }
    
    let geoJSON;
    
    // Skip clipping for region-specific layers and boundary layers
    const isGBLayer = layerId === 'gb-provincial' || layerId === 'gb-district';
    const isPunjabLayer = layerId === 'punjab-provincial' || layerId === 'wildlife-occurrence' || layerId === 'punjab-lulc'; // Punjab-specific layers
    const isSindhLayer = layerId === 'sindh-provincial'; // Sindh-specific layers
    const isBalochistanLayer = layerId === 'balochistan-provincial'; // Balochistan-specific layers
    const isKPLayer = layerId === 'kp-provincial'; // KP-specific layers
    const isAJKLayer = layerId === 'ajk-provincial'; // AJK-specific layers
    const isPakistanLULCLayer = layerId === 'pakistan-lulc'; // Pakistan LULC layer (national level)
    const isBoundaryLayer = layerId === 'pakistan-provinces'; // Boundary layers should not be clipped
    
    // Declare geojsonPath at function scope
    let geojsonPath = null;
    
    // Use GeoJSON file if available, otherwise convert from shapefile
    if (layer.geojson) {
      // For region-specific clipping, use pre-clipped files if available
      if ((region === 'Gilgit Baltistan' || region === 'Punjab' || region === 'Sindh' || region === 'Balochistan' || region === 'Khyber Pakhtunkhwa' || region === 'Azad Kashmir') && !isGBLayer && !isPunjabLayer && !isSindhLayer && !isBalochistanLayer && !isKPLayer && !isAJKLayer && !isBoundaryLayer) {
        // Determine the suffix based on region
        let regionSuffix = '';
        if (region === 'Gilgit Baltistan') {
          regionSuffix = 'gb';
        } else if (region === 'Punjab') {
          regionSuffix = 'punjab';
        } else if (region === 'Sindh') {
          regionSuffix = 'sindh';
        } else if (region === 'Balochistan') {
          regionSuffix = 'balochistan';
        } else if (region === 'Khyber Pakhtunkhwa') {
          regionSuffix = 'kp';
        } else if (region === 'Azad Kashmir') {
          regionSuffix = 'ajk';
        }
        // Try to use pre-clipped region file (e.g., kbas-gb.geojson or kbas-punjab.geojson or kbas-sindh.geojson or kbas-balochistan.geojson or kbas-kp.geojson)
        const regionPath = join(__dirname, '..', layer.geojson.replace('.geojson', `-${regionSuffix}.geojson`));
        if (existsSync(regionPath)) {
          geojsonPath = regionPath;
          console.log(`Using pre-clipped ${region} file for ${layerId}`);
        } else {
          // Fallback to original file (will be clipped on-the-fly if boundary is available)
          geojsonPath = join(__dirname, '..', layer.geojson);
          console.log(`Pre-clipped ${region} file not found for ${layerId}, using original file`);
        }
      } else {
        geojsonPath = join(__dirname, '..', layer.geojson);
      }
      
      console.log(`Loading GeoJSON from: ${geojsonPath}`);
      
      // Check if file exists
      if (!existsSync(geojsonPath)) {
        console.error(`GeoJSON file not found: ${geojsonPath}`);
        return res.status(404).json({ 
          error: `GeoJSON file not found for layer ${layerId}`, 
          path: geojsonPath 
        });
      }
      
      try {
      const geojsonData = readFileSync(geojsonPath, 'utf8');
      geoJSON = JSON.parse(geojsonData);
        
        // Validate it's a valid GeoJSON
        if (!geoJSON || typeof geoJSON !== 'object') {
          throw new Error('Invalid GeoJSON format: not an object');
        }
        if (!geoJSON.type) {
          geoJSON.type = 'FeatureCollection'; // Set default type if missing
        }
        // Ensure features array exists
        if (!geoJSON.features) {
          geoJSON.features = [];
        }
      } catch (parseError) {
        console.error(`Error parsing GeoJSON file ${geojsonPath}:`, parseError);
        console.error('Parse error details:', parseError.stack);
        return res.status(500).json({ 
          error: `Failed to parse GeoJSON file for layer ${layerId}`, 
          details: parseError.message,
          path: geojsonPath
        });
      }
    } else if (layer.path) {
      // Fallback to shapefile conversion for boundary layer
      const shapefilePath = join(__dirname, '..', layer.path);
      console.log(`Loading shapefile from: ${shapefilePath}`);
      geoJSON = await convertShapefileToGeoJSON(shapefilePath);
      // For shapefiles, skip on-the-fly clipping (not applicable)
    } else {
      return res.status(404).json({ error: `No data source found for layer ${layerId}` });
    }
    
    // Only clip on-the-fly if pre-clipped file doesn't exist and boundary is available
    // This is a fallback for layers that haven't been pre-clipped yet
    // Only applies to GeoJSON files (geojsonPath is defined)
    if (layer.geojson && (region === 'Gilgit Baltistan' || region === 'Punjab' || region === 'Sindh' || region === 'Balochistan' || region === 'Khyber Pakhtunkhwa' || region === 'Azad Kashmir') && !isGBLayer && !isPunjabLayer && !isSindhLayer && !isBalochistanLayer && !isKPLayer && !isAJKLayer && !isBoundaryLayer) {
      let regionSuffix = '';
      let regionBoundary = null;
      
      if (region === 'Gilgit Baltistan') {
        regionSuffix = 'gb';
        regionBoundary = GB_BOUNDARY;
      } else if (region === 'Punjab') {
        regionSuffix = 'punjab';
        regionBoundary = PUNJAB_BOUNDARY;
      } else if (region === 'Sindh') {
        regionSuffix = 'sindh';
        regionBoundary = SINDH_BOUNDARY;
      } else if (region === 'Balochistan') {
        regionSuffix = 'balochistan';
        regionBoundary = BALOCHISTAN_BOUNDARY;
      } else if (region === 'Khyber Pakhtunkhwa') {
        regionSuffix = 'kp';
        regionBoundary = KP_BOUNDARY;
      } else if (region === 'Azad Kashmir') {
        regionSuffix = 'ajk';
        regionBoundary = AJK_BOUNDARY;
      }
      
      const isPreClippedFile = geojsonPath && (geojsonPath.includes(`-${regionSuffix}.geojson`));
      
      if (!isPreClippedFile && regionBoundary) {
        console.log(`Clipping layer ${layerId} to ${region} boundary (on-the-fly)...`);
        const beforeCount = geoJSON.features ? geoJSON.features.length : 0;
        geoJSON = clipToBoundary(geoJSON, regionBoundary);
        const afterCount = geoJSON.features ? geoJSON.features.length : 0;
        console.log(`Clipped ${layerId}: ${beforeCount} -> ${afterCount} features`);
        console.log(`Note: Consider running 'node scripts/clip-layers-to-region.js --region=${region}' to pre-clip this layer for better performance`);
      }
    }
    
    // Ensure features array exists (even if empty)
    if (!geoJSON.features) {
      geoJSON.features = [];
    }
    
    const featureCount = geoJSON.features.length;
    console.log(`Sending GeoJSON for ${layerId} (${region}): ${featureCount} features`);
    
    if (featureCount === 0) {
      console.warn(`WARNING: Layer ${layerId} (${layer.name}) has no features after clipping!`);
    }
    
    // Ensure valid GeoJSON structure
    if (!geoJSON.type) {
      geoJSON.type = 'FeatureCollection';
    }
    
    // Cache the result with region key
    layerCache.set(cacheKey, geoJSON);
    
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

// Serve frontend static files (in production)
// IMPORTANT: This must be after API routes but before catch-all
const clientDistPath = join(__dirname, '../client/dist');
if (existsSync(clientDistPath)) {
  // Serve static assets (CSS, JS, images, etc.)
  app.use(express.static(clientDistPath, {
    maxAge: '1d', // Cache static assets for 1 day
    etag: true
  }));
  
  console.log('📦 Frontend build found - serving from:', clientDistPath);
} else {
  console.log('⚠️  Frontend build not found at:', clientDistPath);
  console.log('   API-only mode - frontend must be built separately');
}

// Catch-all handler: send back React's index.html file for SPA routing
// This MUST be last, after all API routes and static file serving
app.get('*', (req, res, next) => {
  // Skip API routes - they should have been handled above
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  // Only serve index.html if dist folder exists
  if (existsSync(clientDistPath)) {
    const indexPath = join(clientDistPath, 'index.html');
    if (existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
  }
  
  // If no frontend build, return 404
  res.status(404).json({ error: 'Frontend not built. Please run: npm run build' });
});

// Load Pakistan boundary on startup with timeout
const BOUNDARY_LOAD_TIMEOUT = 10000; // 10 seconds

Promise.all([
Promise.race([
  loadPakistanBoundary(),
  new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Pakistan boundary loading timeout')), BOUNDARY_LOAD_TIMEOUT)
    )
  ]).catch((error) => {
    console.warn('Error loading Pakistan boundary:', error.message);
    return null; // Continue even if Pakistan boundary fails
  }),
  Promise.race([
    loadGBBoundary(),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('GB boundary loading timeout')), BOUNDARY_LOAD_TIMEOUT)
  )
  ]).catch((error) => {
    console.warn('Error loading GB boundary:', error.message);
    return null; // Continue even if GB boundary fails
  }),
  Promise.race([
    loadPunjabBoundary(),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Punjab boundary loading timeout')), BOUNDARY_LOAD_TIMEOUT)
    )
  ]).catch((error) => {
    console.warn('Error loading Punjab boundary:', error.message);
    return null; // Continue even if Punjab boundary fails
  }),
  Promise.race([
    loadSindhBoundary(),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Sindh boundary loading timeout')), BOUNDARY_LOAD_TIMEOUT)
    )
  ]).catch((error) => {
    console.warn('Error loading Sindh boundary:', error.message);
    return null; // Continue even if Sindh boundary fails
  }),
  Promise.race([
    loadBalochistanBoundary(),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Balochistan boundary loading timeout')), BOUNDARY_LOAD_TIMEOUT)
    )
  ]).catch((error) => {
    console.warn('Error loading Balochistan boundary:', error.message);
    return null; // Continue even if Balochistan boundary fails
  }),
  Promise.race([
    loadKPBoundary(),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('KP boundary loading timeout')), BOUNDARY_LOAD_TIMEOUT)
    )
  ]).catch((error) => {
    console.warn('Error loading KP boundary:', error.message);
    return null; // Continue even if KP boundary fails
  }),
  Promise.race([
    loadAJKBoundary(),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('AJK boundary loading timeout')), BOUNDARY_LOAD_TIMEOUT)
    )
  ]).catch((error) => {
    console.warn('Error loading AJK boundary:', error.message);
    return null; // Continue even if AJK boundary fails
  })
]).then(() => {
  startServer();
}).catch((error) => {
  console.error('Error loading boundaries:', error.message);
  if (error.stack) {
    console.error('Stack:', error.stack);
  }
  // Start server anyway with default bounds
  startServer(true);
});

function startServer(usingDefaultBounds = false) {
  try {
    // Bind to 0.0.0.0 to allow external connections (required for Render)
    const HOST = process.env.HOST || '0.0.0.0';
    app.listen(PORT, HOST, () => {
      console.log(`🚀 Biodiversity Portal API server running on http://${HOST}:${PORT}`);
    console.log(`📊 Available layers: ${Object.keys(layerConfig).length}`);
      if (usingDefaultBounds) {
    console.log('⚠️  Using default Pakistan bounds');
      }
      console.log('✅ Server is ready to accept requests');
});
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}


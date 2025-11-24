# PostgreSQL + PostGIS Migration Plan
## Biodiversity Portal - GeoJSON to Database Migration

### Overview
Migrate from static GeoJSON files to PostgreSQL with PostGIS extension for better scalability, performance, and data management.

---

## Phase 1: Database Setup & Infrastructure

### 1.1 Prerequisites
- PostgreSQL 14+ with PostGIS extension
- Node.js database client (pg or node-postgres)
- Shapefile import tools (shp2pgsql or ogr2ogr)

### 1.2 Database Schema Design

```sql
-- Main layers table
CREATE TABLE layers (
    id SERIAL PRIMARY KEY,
    layer_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7),
    type VARCHAR(20), -- 'polygon', 'point', 'linestring', 'raster'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Features table (stores all geometries)
CREATE TABLE features (
    id SERIAL PRIMARY KEY,
    layer_id VARCHAR(100) REFERENCES layers(layer_id),
    feature_id VARCHAR(255), -- Original feature ID from shapefile
    geometry GEOMETRY, -- PostGIS geometry column
    properties JSONB, -- All attribute data as JSON
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Spatial indexes for performance
CREATE INDEX idx_features_geometry ON features USING GIST(geometry);
CREATE INDEX idx_features_layer ON features(layer_id);
CREATE INDEX idx_features_properties ON features USING GIN(properties);

-- Metadata table for layer statistics
CREATE TABLE layer_metadata (
    id SERIAL PRIMARY KEY,
    layer_id VARCHAR(100) REFERENCES layers(layer_id),
    feature_count INTEGER,
    bounds GEOMETRY(POLYGON, 4326),
    last_updated TIMESTAMP DEFAULT NOW()
);
```

### 1.3 Required NPM Packages

```json
{
  "dependencies": {
    "pg": "^8.11.0",
    "postgis": "^0.0.2",
    "multer": "^1.4.5-lts.1",
    "ogr2ogr": "^1.2.1",
    "node-shp": "^1.0.0"
  }
}
```

---

## Phase 2: Shapefile Upload & Import System

### 2.1 Upload Endpoint Design

**POST /api/admin/layers/upload**
- Accept multipart/form-data with shapefile (.shp, .shx, .dbf, .prj)
- Validate shapefile structure
- Extract metadata (CRS, feature count, bounds)
- Import to PostgreSQL using PostGIS functions

### 2.2 Import Process Flow

```
1. Upload shapefile → Temporary storage
2. Validate shapefile components
3. Detect CRS (Coordinate Reference System)
4. Transform to WGS84 (EPSG:4326) if needed
5. Extract attributes → JSONB
6. Insert into features table with geometry
7. Update layer_metadata
8. Create spatial indexes
9. Cleanup temporary files
```

### 2.3 Implementation Strategy

**Option A: Using ogr2ogr (Recommended)**
- Most reliable for CRS transformation
- Handles complex geometries well
- Can import directly to PostGIS

**Option B: Using shp2pgsql**
- PostgreSQL native tool
- Faster for large datasets
- Requires manual CRS handling

**Option C: Node.js parsing (Current approach)**
- Use existing shapefile library
- More control over import process
- Better error handling

---

## Phase 3: API Refactoring

### 3.1 New API Endpoints

```javascript
// Get all layers (metadata only)
GET /api/layers
// Returns: [{ id, name, description, feature_count, bounds }]

// Get layer features (with spatial filtering)
GET /api/layers/:layerId
Query params:
  - bbox: "minLng,minLat,maxLng,maxLat" (bounding box filter)
  - limit: number (pagination)
  - offset: number (pagination)
  - simplify: number (geometry simplification tolerance)

// Get layer features within bounds (optimized)
GET /api/layers/:layerId/features
Query params:
  - bounds: GeoJSON bbox
  - zoom: map zoom level (for simplification)

// Upload new layer
POST /api/admin/layers/upload
Body: multipart/form-data (shapefile)

// Update layer
PUT /api/admin/layers/:layerId

// Delete layer
DELETE /api/admin/layers/:layerId
```

### 3.2 Query Optimization Strategies

**A. Bounding Box Filtering**
```sql
SELECT 
    id,
    feature_id,
    ST_AsGeoJSON(geometry)::json as geometry,
    properties
FROM features
WHERE layer_id = $1
  AND geometry && ST_MakeEnvelope($2, $3, $4, $5, 4326)
LIMIT $6 OFFSET $7;
```

**B. Geometry Simplification (for performance)**
```sql
-- Simplify based on zoom level
SELECT 
    id,
    feature_id,
    ST_AsGeoJSON(
        ST_Simplify(geometry, $simplify_tolerance)
    )::json as geometry,
    properties
FROM features
WHERE layer_id = $1
  AND geometry && ST_MakeEnvelope(...);
```

**C. Clustering for Point Data**
```sql
-- For point layers, use clustering at low zoom levels
SELECT 
    ST_ClusterKMeans(geometry, 10) OVER() as cluster_id,
    ST_AsGeoJSON(geometry)::json as geometry,
    properties
FROM features
WHERE layer_id = $1;
```

---

## Phase 4: Performance Optimization

### 4.1 Caching Strategy

**Multi-Level Caching:**
1. **Database Query Cache** - Cache common queries
2. **Redis Cache** - Cache full layer responses
3. **CDN/Static Cache** - For frequently accessed layers

```javascript
// Redis caching example
const cacheKey = `layer:${layerId}:${bbox}:${zoom}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

// Query database
const features = await db.query(...);
await redis.setex(cacheKey, 3600, JSON.stringify(features));
```

### 4.2 Pagination & Streaming

**For Large Datasets:**
- Implement cursor-based pagination
- Use streaming responses for very large datasets
- Return GeoJSON FeatureCollection incrementally

### 4.3 Spatial Indexing

```sql
-- Ensure spatial indexes are created
CREATE INDEX CONCURRENTLY idx_features_geometry_gist 
ON features USING GIST(geometry);

-- Analyze tables for query optimization
ANALYZE features;
ANALYZE layers;
```

### 4.4 Materialized Views (for complex queries)

```sql
-- Pre-compute layer statistics
CREATE MATERIALIZED VIEW layer_stats AS
SELECT 
    layer_id,
    COUNT(*) as feature_count,
    ST_Envelope(ST_Collect(geometry)) as bounds
FROM features
GROUP BY layer_id;

-- Refresh periodically
REFRESH MATERIALIZED VIEW CONCURRENTLY layer_stats;
```

---

## Phase 5: Frontend Compatibility

### 5.1 API Response Format

**Maintain GeoJSON Format:**
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "id": 123,
      "geometry": {...},
      "properties": {...}
    }
  ],
  "metadata": {
    "total": 1000,
    "returned": 100,
    "bounds": [...]
  }
}
```

### 5.2 Frontend Changes (Minimal)

- **No changes needed** if API maintains GeoJSON format
- Add pagination handling if implemented
- Add loading states for large datasets
- Implement progressive loading (load visible area first)

### 5.3 Map Optimization

```javascript
// Load features based on viewport
const bounds = map.getBounds();
const bbox = [
  bounds.getWest(),
  bounds.getSouth(),
  bounds.getEast(),
  bounds.getNorth()
];

// Request only visible features
fetch(`/api/layers/${layerId}?bbox=${bbox.join(',')}`)
```

---

## Phase 6: Migration Path

### 6.1 Step-by-Step Migration

**Step 1: Setup Database**
- Install PostgreSQL + PostGIS
- Create schema
- Setup connection pool

**Step 2: Import Existing GeoJSON**
- Convert existing GeoJSON files to PostGIS
- Import all current layers
- Verify data integrity

**Step 3: Dual Mode (Transition Period)**
- Support both GeoJSON files and database
- Use feature flag to switch between modes
- Test database queries thoroughly

**Step 4: Switch to Database**
- Update all endpoints to use database
- Remove GeoJSON file dependencies
- Monitor performance

**Step 5: Cleanup**
- Remove GeoJSON file serving
- Archive old files
- Update documentation

### 6.2 Data Import Script

```javascript
// scripts/import-geojson-to-postgis.js
import { Pool } from 'pg';
import { readFileSync } from 'fs';
import * as turf from '@turf/turf';

const pool = new Pool({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432
});

async function importGeoJSON(layerId, geojsonPath) {
  const geojson = JSON.parse(readFileSync(geojsonPath, 'utf8'));
  
  for (const feature of geojson.features) {
    const geometry = JSON.stringify(feature.geometry);
    const properties = JSON.stringify(feature.properties || {});
    
    await pool.query(`
      INSERT INTO features (layer_id, feature_id, geometry, properties)
      VALUES ($1, $2, ST_GeomFromGeoJSON($3), $4)
    `, [
      layerId,
      feature.id || feature.properties?.id,
      geometry,
      properties
    ]);
  }
}
```

---

## Phase 7: Implementation Checklist

### Backend Setup
- [ ] Install PostgreSQL + PostGIS
- [ ] Create database schema
- [ ] Install required npm packages (pg, multer, etc.)
- [ ] Setup database connection pool
- [ ] Create database service layer

### Import System
- [ ] Create shapefile upload endpoint
- [ ] Implement shapefile validation
- [ ] Build PostGIS import function
- [ ] Add CRS transformation
- [ ] Create import script for existing GeoJSON

### API Refactoring
- [ ] Refactor GET /api/layers to query database
- [ ] Add bounding box filtering
- [ ] Implement pagination
- [ ] Add geometry simplification
- [ ] Implement caching layer

### Performance
- [ ] Create spatial indexes
- [ ] Setup Redis caching (optional)
- [ ] Implement query optimization
- [ ] Add connection pooling
- [ ] Monitor query performance

### Testing
- [ ] Test with small datasets
- [ ] Test with large datasets (100k+ features)
- [ ] Test bounding box queries
- [ ] Test CRS transformations
- [ ] Load testing

### Frontend
- [ ] Verify API compatibility
- [ ] Test map rendering
- [ ] Test layer switching
- [ ] Test with different zoom levels
- [ ] Performance testing

---

## Phase 8: Environment Configuration

### .env.example
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=biodiversity_portal
DB_USER=postgres
DB_PASSWORD=your_password
DB_SSL=false

# Connection Pool
DB_POOL_MIN=2
DB_POOL_MAX=10

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_TTL=3600

# Upload
UPLOAD_MAX_SIZE=100MB
UPLOAD_TEMP_DIR=./uploads
```

---

## Phase 9: Performance Benchmarks

### Expected Performance Improvements

**Current (GeoJSON Files):**
- Load time: 2-5 seconds for large layers
- Memory: High (loads entire file)
- Scalability: Limited by file size

**With PostGIS:**
- Load time: 0.5-2 seconds (with bbox filtering)
- Memory: Low (only loads visible features)
- Scalability: Handles millions of features
- Query speed: 10-100x faster with spatial indexes

### Optimization Targets
- Initial page load: < 1 second
- Layer switching: < 500ms
- Bounding box queries: < 200ms
- Feature count: Support 1M+ features per layer

---

## Phase 10: Monitoring & Maintenance

### Monitoring
- Query execution time
- Database connection pool usage
- Cache hit rates
- Feature count per layer
- API response times

### Maintenance Tasks
- Regular VACUUM ANALYZE
- Index maintenance
- Cache invalidation strategy
- Backup strategy
- Data validation scripts

---

## Recommended Implementation Order

1. **Week 1**: Database setup, schema creation, import existing GeoJSON
2. **Week 2**: Build upload endpoint, shapefile import functionality
3. **Week 3**: Refactor API endpoints, add spatial queries
4. **Week 4**: Performance optimization, caching, testing
5. **Week 5**: Frontend testing, migration, cleanup

---

## Risk Mitigation

1. **Data Loss**: Always backup before migration
2. **Performance Issues**: Test with production-like data volumes
3. **Compatibility**: Maintain GeoJSON API format
4. **Downtime**: Use feature flags for gradual rollout
5. **CRS Issues**: Validate all coordinate transformations

---

## Conclusion

This migration will provide:
- ✅ Better scalability (millions of features)
- ✅ Faster queries with spatial indexing
- ✅ Dynamic data updates (no file management)
- ✅ Better data integrity
- ✅ Support for complex spatial queries
- ✅ Easier data management and updates


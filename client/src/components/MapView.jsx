import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import L from 'leaflet'
import Legend from './Legend'
import { FaMap, FaSatellite } from 'react-icons/fa'

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Pakistan center coordinates (will be updated from API)
let PAKISTAN_CENTER = [30.3753, 69.3451]
let PAKISTAN_ZOOM = 6

// Custom marker icon for point data
function createCustomIcon(color) {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  })
}

// Base map switcher component
function BaseMapSwitcher({ baseMap, onBaseMapChange }) {
  const map = useMap()

  useEffect(() => {
    // This will be handled by the parent component
  }, [baseMap, map])

  return null
}

// Component to prevent auto-zooming to layer bounds
function MapBoundsController() {
  const map = useMap()
  
  useEffect(() => {
    // Keep map centered on Pakistan, don't auto-fit to layers
    // This prevents layers with large bounds from zooming out the map
    const currentCenter = map.getCenter()
    const currentZoom = map.getZoom()
    
    // Only reset if map has been zoomed out too far (likely by a layer with bad bounds)
    if (currentZoom < 4) {
      map.setView(PAKISTAN_CENTER, PAKISTAN_ZOOM, { animate: false })
    } else if (
      Math.abs(currentCenter.lat - PAKISTAN_CENTER[0]) > 10 ||
      Math.abs(currentCenter.lng - PAKISTAN_CENTER[1]) > 10
    ) {
      // If center is way off, reset it
      map.setView(PAKISTAN_CENTER, currentZoom, { animate: false })
    }
  }, [map])
  
  return null
}

// Component to handle map resize on mobile
function MapResizer() {
  const map = useMap()
  
  useEffect(() => {
    // Trigger resize after a short delay to ensure container is rendered
    // This is critical for mobile devices
    const timeoutId = setTimeout(() => {
      map.invalidateSize()
    }, 100)
    
    // Also resize after a longer delay to catch any layout shifts
    const timeoutId2 = setTimeout(() => {
      map.invalidateSize()
    }, 500)
    
    // Also resize on window resize and orientation change
    const handleResize = () => {
      setTimeout(() => {
        map.invalidateSize()
      }, 100)
    }
    
    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)
    
    // Force resize when map is ready
    map.whenReady(() => {
      setTimeout(() => {
        map.invalidateSize()
      }, 200)
    })
    
    return () => {
      clearTimeout(timeoutId)
      clearTimeout(timeoutId2)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
    }
  }, [map])
  
  return null
}

// Component to handle region-based zooming
function RegionZoomController({ selectedRegion, layerData, activeLayers }) {
  const map = useMap()
  const hasZoomedRef = useRef(false)
  
  useEffect(() => {
    if (selectedRegion === 'Gilgit Baltistan') {
      // Check if gb-district or gb-provincial layer is active and loaded
      const hasGbLayer = activeLayers.has('gb-district') || activeLayers.has('gb-provincial')
      const gbLayerData = layerData['gb-district'] || layerData['gb-provincial']
      
      if (hasGbLayer && gbLayerData && gbLayerData.features && gbLayerData.features.length > 0) {
        // Calculate bounds from GeoJSON features
        const bounds = L.latLngBounds([])
        
        gbLayerData.features.forEach(feature => {
          if (feature.geometry && feature.geometry.coordinates) {
            const extractCoords = (coords) => {
              if (Array.isArray(coords[0])) {
                coords.forEach(c => extractCoords(c))
              } else if (coords.length === 2 && typeof coords[0] === 'number') {
                // [lng, lat] format
                bounds.extend([coords[1], coords[0]])
              }
            }
            extractCoords(feature.geometry.coordinates)
          }
        })
        
        if (bounds.isValid() && !hasZoomedRef.current) {
          // Add some padding around the bounds
          map.fitBounds(bounds, { 
            padding: [50, 50],
            maxZoom: 9,
            animate: true,
            duration: 0.8
          })
          console.log('Zoomed to Gilgit Baltistan bounds')
          hasZoomedRef.current = true
        }
      }
    } else if (selectedRegion === 'National') {
      // Zoom back to Pakistan view
      if (hasZoomedRef.current) {
        map.setView(PAKISTAN_CENTER, PAKISTAN_ZOOM, { 
          animate: true,
          duration: 0.8
        })
        console.log('Zoomed to National view')
        hasZoomedRef.current = false
      }
    }
  }, [selectedRegion, layerData, map, activeLayers])
  
  // Reset zoom flag when region changes
  useEffect(() => {
    hasZoomedRef.current = false
  }, [selectedRegion])
  
  return null
}

export default function MapView({ layers, activeLayers, selectedRegion = 'National' }) {
  const geoJsonRefs = useRef({})
  const [layerData, setLayerData] = useState({})
  const [loading, setLoading] = useState(new Set())
  const [baseMap, setBaseMap] = useState('osm') // 'osm' or 'satellite'
  const [mapCenter, setMapCenter] = useState(PAKISTAN_CENTER)
  const [mapZoom, setMapZoom] = useState(PAKISTAN_ZOOM)
  const activeLayersRef = useRef(activeLayers)
  const layerDataRef = useRef({})
  const loadingRef = useRef(new Set())

  // Pakistan bounds are set as constants, no need to fetch

  // Update refs when state changes
  useEffect(() => {
    activeLayersRef.current = activeLayers
    layerDataRef.current = layerData
    loadingRef.current = loading
  }, [activeLayers, layerData, loading])

  // Load layers when they become active
  useEffect(() => {
    const activeArray = Array.from(activeLayers)
    
    // Load new layers using Promise.all to handle async properly
    const loadLayers = async () => {
      const loadPromises = activeArray.map(async (layerId) => {
        // Check if we need to load this layer
        const currentData = layerDataRef.current
        const currentLoading = loadingRef.current
        
        if (!currentData[layerId] && !currentLoading.has(layerId)) {
          setLoading(prev => {
            const newSet = new Set(prev)
            newSet.add(layerId)
            loadingRef.current = newSet
            return newSet
          })
          
          try {
            // Use relative URL when served from same domain, otherwise use env var or localhost
            const apiUrl = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? '' : 'http://localhost:3001')
            const apiEndpoint = apiUrl ? `${apiUrl}/api/layers/${layerId}` : `/api/layers/${layerId}`
            const response = await fetch(apiEndpoint)
            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}))
              throw new Error(errorData.error || `Failed to load ${layerId}: ${response.status}`)
            }
            const data = await response.json()
            console.log(`Loaded layer ${layerId}:`, {
              featureCount: data.features?.length || 0,
              hasFeatures: data.features && data.features.length > 0
            })
            if (!data.features || data.features.length === 0) {
              console.warn(`Layer ${layerId} loaded but has no features`)
            }
            // Use functional update to avoid race conditions
            setLayerData(prev => {
              // Only update if layer is still active (check current activeLayers)
              const currentActive = activeLayersRef.current
              if (currentActive.has(layerId)) {
                const newData = { ...prev, [layerId]: data }
                layerDataRef.current = newData
                return newData
              }
              return prev
            })
            return { layerId, success: true }
          } catch (error) {
            console.error(`Error loading layer ${layerId}:`, error)
            return { layerId, success: false, error }
          } finally {
            setLoading(prev => {
              const newSet = new Set(prev)
              newSet.delete(layerId)
              loadingRef.current = newSet
              return newSet
            })
          }
        }
        return { layerId, skipped: true }
      })
      
      await Promise.all(loadPromises)
    }
    
    loadLayers()
  }, [activeLayers]) // Only depend on activeLayers, use refs for current state

  // Clean up removed layers in a separate effect to avoid conflicts
  useEffect(() => {
    setLayerData(prev => {
      const newData = { ...prev }
      let changed = false
      Object.keys(newData).forEach(layerId => {
        if (!activeLayers.has(layerId)) {
          delete newData[layerId]
          changed = true
        }
      })
      if (changed) {
        layerDataRef.current = newData
        return newData
      }
      return prev
    })
  }, [activeLayers])

  const getLayerStyle = (layer, feature) => {
    // Special styling for Pakistan Provinces layer - hollow with black outline
    if (layer.id === 'pakistan-provinces') {
      return {
        color: '#000000', // Black outline
        weight: 2,
        opacity: 1,
        fillColor: 'transparent', // Hollow/transparent fill
        fillOpacity: 0,
        dashArray: undefined
      }
    }
    
    // For polygons and lines, use better colors
    return {
      color: layer.color,
      weight: 2.5,
      opacity: 0.9,
      fillColor: layer.color,
      fillOpacity: 0.35,
      dashArray: layer.type === 'line' ? '5, 5' : undefined
    }
  }

  const getPointToLayer = (layer) => {
    return (feature, latlng) => {
      return L.marker(latlng, {
        icon: createCustomIcon(layer.color)
      })
    }
  }

  const onEachFeature = (feature, layer, layerConfig) => {
    // Validate feature geometry
    if (!feature.geometry || !feature.geometry.coordinates) {
      console.warn('Feature missing geometry:', feature)
      return
    }
    
    if (feature.properties) {
      const props = feature.properties
      const popupContent = `
        <div style="max-width: 300px;">
          <h3 style="font-weight: bold; margin-bottom: 8px; color: ${layerConfig.color};">${layerConfig.name}</h3>
          <div style="font-size: 12px;">
            ${Object.keys(props)
              .map(key => `<div style="margin: 4px 0;"><strong>${key}:</strong> ${props[key]}</div>`)
              .join('')}
          </div>
        </div>
      `
      layer.bindPopup(popupContent)
    }
    layer.on({
      mouseover: (e) => {
        const layer = e.target
        const isPoint = layer instanceof L.Marker
        if (!isPoint) {
          layer.setStyle({
            weight: 4,
            opacity: 1,
            fillOpacity: 0.6,
          })
        } else {
          // Make point marker larger on hover
          const hoverColor = layerConfig.color
          layer.setIcon(L.divIcon({
            className: 'custom-marker',
            html: `<div style="background-color: ${hoverColor}; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 3px 6px rgba(0,0,0,0.4);"></div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8]
          }))
        }
      },
      mouseout: (e) => {
        const layer = e.target
        const isPoint = layer instanceof L.Marker
        if (!isPoint) {
          const style = getLayerStyle(layerConfig, feature)
          layer.setStyle(style)
        } else {
          // Reset point marker to normal size
          layer.setIcon(createCustomIcon(layerConfig.color))
        }
      },
    })
  }

  const activeLayersList = layers.filter(l => activeLayers.has(l.id))

  return (
    <div className="relative w-full" style={{ height: '100%', width: '100%', minHeight: '400px', position: 'relative' }}>
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%', position: 'relative' }}
        zoomControl={true}
        maxZoom={18}
        minZoom={4}
      >
        {baseMap === 'osm' ? (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        ) : (
          <TileLayer
            attribution='&copy; <a href="https://www.esri.com/">Esri</a> &copy; <a href="https://www.maxar.com/">Maxar</a>'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        )}
        
        <BaseMapSwitcher baseMap={baseMap} onBaseMapChange={setBaseMap} />
        <MapBoundsController />
        <MapResizer />
        <RegionZoomController selectedRegion={selectedRegion} layerData={layerData} activeLayers={activeLayers} />
        
        {Array.from(activeLayers).map((layerId) => {
          const layer = layers.find(l => l.id === layerId)
          const data = layerData[layerId]
          const isLoading = loading.has(layerId)
          
          // If layer is loading, don't render yet (avoid race condition warnings)
          if (isLoading) {
            return null
          }
          
          if (!layer) {
            // Only warn if not loading (to avoid spam during initial load)
            if (!isLoading) {
              console.warn(`Layer ${layerId}: Missing layer config`)
            }
            return null
          }
          
          if (!data) {
            // Data is still loading, don't warn yet
            return null
          }
          
          if (!data.features || data.features.length === 0) {
            console.warn(`Layer ${layerId} (${layer.name}) has no features in GeoJSON`)
            return null
          }
          
          // Validate and filter data
          const validData = {
            ...data,
            features: data.features.filter(f => {
              if (!f.geometry || !f.geometry.coordinates) {
                console.warn(`Feature in ${layerId} missing geometry:`, f)
                return false
              }
              return true
            })
          }
          
          if (validData.features.length === 0) {
            console.warn(`Layer ${layerId} (${layer.name}) has no valid features after filtering`)
            return null
          }
          
          const geoJsonProps = {
            data: validData,
            onEachFeature: (feature, layerInstance) => {
              try {
                onEachFeature(feature, layerInstance, layer)
              } catch (e) {
                console.error(`Error processing feature in ${layerId}:`, e)
              }
            },
            ref: (el) => {
              if (el) {
                geoJsonRefs.current[layerId] = el
              }
            }
          }

          // Add pointToLayer for point data, style for polygon/line data
          if (layer.type === 'point') {
            geoJsonProps.pointToLayer = getPointToLayer(layer)
          } else {
            geoJsonProps.style = (feature) => getLayerStyle(layer, feature)
          }
          
          return <GeoJSON key={layerId} {...geoJsonProps} />
        })}
      </MapContainer>

      {/* Base Map Switcher Button - Fixed on map, above bottom sheet */}
      <div className="absolute top-2 sm:top-4 right-2 sm:right-4 z-[1100] bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden" style={{ pointerEvents: 'auto' }}>
        <div className="flex">
          <button
            onClick={() => setBaseMap('osm')}
            className={`px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 text-xs sm:text-sm font-medium transition-all flex items-center space-x-1 sm:space-x-2 ${
              baseMap === 'osm'
                ? 'bg-green-600 text-white shadow-inner'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FaMap className={baseMap === 'osm' ? 'text-white text-sm sm:text-base' : 'text-gray-600 text-sm sm:text-base'} />
            <span className="hidden sm:inline">Map</span>
          </button>
          <div className="w-px bg-gray-200"></div>
          <button
            onClick={() => setBaseMap('satellite')}
            className={`px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 text-xs sm:text-sm font-medium transition-all flex items-center space-x-1 sm:space-x-2 ${
              baseMap === 'satellite'
                ? 'bg-green-600 text-white shadow-inner'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FaSatellite className={baseMap === 'satellite' ? 'text-white text-sm sm:text-base' : 'text-gray-600 text-sm sm:text-base'} />
            <span className="hidden sm:inline">Satellite</span>
          </button>
        </div>
      </div>

      {/* Dynamic Legend */}
      <Legend layers={activeLayersList} activeLayers={activeLayers} />
    </div>
  )
}

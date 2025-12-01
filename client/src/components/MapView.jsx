import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import Legend from './Legend'
import { FaMap, FaSatellite } from 'react-icons/fa'
import MBTilesOverlay from './MBTilesOverlay'
import WMSOverlay from './WMSOverlay'

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
    html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4); cursor: pointer;"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
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

// Component to restrict zoom level when forest-types layer is active
function ForestTypesZoomController({ activeLayers }) {
  const map = useMap()
  const isForestTypesActive = activeLayers.has('forest-types')
  const previousMaxZoomRef = useRef(18)
  const zoomHandlerRef = useRef(null)
  
  useEffect(() => {
    if (isForestTypesActive) {
      // Store the current maxZoom before restricting (should be 18 by default)
      const currentMaxZoom = map.getMaxZoom()
      if (currentMaxZoom > 6) {
        previousMaxZoomRef.current = currentMaxZoom
      }
      
      // Restrict maxZoom to 6
      map.setMaxZoom(6)
      
      // If current zoom is greater than 6, set it to 6
      const currentZoom = map.getZoom()
      if (currentZoom > 6) {
        map.setZoom(6, { animate: true })
      }
      
      // Prevent zooming beyond 6
      const handleZoom = () => {
        if (map.getZoom() > 6) {
          map.setZoom(6, { animate: false })
        }
      }
      
      zoomHandlerRef.current = handleZoom
      map.on('zoom', handleZoom)
      
      return () => {
        if (zoomHandlerRef.current) {
          map.off('zoom', zoomHandlerRef.current)
          zoomHandlerRef.current = null
        }
        // Restore previous maxZoom when layer is deactivated
        map.setMaxZoom(previousMaxZoomRef.current)
      }
    } else {
      // Restore previous maxZoom when layer is deactivated
      if (zoomHandlerRef.current) {
        map.off('zoom', zoomHandlerRef.current)
        zoomHandlerRef.current = null
      }
      map.setMaxZoom(previousMaxZoomRef.current)
    }
  }, [map, isForestTypesActive])
  
  return null
}

// Component to handle map resize on mobile and panel state changes
function MapResizer({ panelOpen }) {
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
  }, [map, panelOpen]) // Add panelOpen as dependency
  
  // Resize when panel state changes
  useEffect(() => {
    if (map) {
      const timeoutId = setTimeout(() => {
        map.invalidateSize()
      }, 350) // Wait for animation to complete (300ms + 50ms buffer)
      
      return () => clearTimeout(timeoutId)
    }
  }, [map, panelOpen])
  
  return null
}

// Component to handle region-based zooming
function RegionZoomController({ selectedRegion, layerData, activeLayers }) {
  const map = useMap()
  const lastRegionRef = useRef(null)
  const zoomTimeoutRef = useRef(null)
  
  useEffect(() => {
    // Clear any pending zoom timeout
    if (zoomTimeoutRef.current) {
      clearTimeout(zoomTimeoutRef.current)
      zoomTimeoutRef.current = null
    }
    
    // Only zoom if region actually changed
    if (lastRegionRef.current === selectedRegion) {
      return
    }
    lastRegionRef.current = selectedRegion
    
    const performZoom = () => {
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
          
          if (bounds.isValid()) {
            // Add some padding around the bounds
            map.fitBounds(bounds, { 
              padding: [50, 50],
              maxZoom: 9,
              animate: true,
              duration: 0.8
            })
            console.log('Zoomed to Gilgit Baltistan bounds')
          }
        } else {
          // If layer data not loaded yet, wait a bit and try again
          zoomTimeoutRef.current = setTimeout(() => {
            performZoom()
          }, 500)
        }
      } else if (selectedRegion === 'Punjab') {
        // Check if punjab-provincial layer is active and loaded
        const hasPunjabLayer = activeLayers.has('punjab-provincial')
        const punjabLayerData = layerData['punjab-provincial']
        
        if (hasPunjabLayer && punjabLayerData && punjabLayerData.features && punjabLayerData.features.length > 0) {
          // Calculate bounds from GeoJSON features
          const bounds = L.latLngBounds([])
          
          punjabLayerData.features.forEach(feature => {
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
          
          if (bounds.isValid()) {
            // Add some padding around the bounds
            map.fitBounds(bounds, { 
              padding: [50, 50],
              maxZoom: 9,
              animate: true,
              duration: 0.8
            })
            console.log('Zoomed to Punjab bounds')
          }
        } else {
          // If layer data not loaded yet, wait a bit and try again
          zoomTimeoutRef.current = setTimeout(() => {
            performZoom()
          }, 500)
        }
      } else if (selectedRegion === 'National') {
        // Zoom back to Pakistan view
        map.setView(PAKISTAN_CENTER, PAKISTAN_ZOOM, { 
          animate: true,
          duration: 0.8
        })
        console.log('Zoomed to National view')
      }
    }
    
    // Perform zoom immediately or after a short delay to ensure layer is active
    zoomTimeoutRef.current = setTimeout(() => {
      performZoom()
    }, 100)
    
    return () => {
      if (zoomTimeoutRef.current) {
        clearTimeout(zoomTimeoutRef.current)
        zoomTimeoutRef.current = null
      }
    }
  }, [selectedRegion, layerData, map, activeLayers])
  
  return null
}

export default function MapView({ layers, activeLayers, selectedRegion = 'National', panelOpen = true, onLayerDataChange, onFeatureSelect }) {
  const geoJsonRefs = useRef({})
  const [layerData, setLayerData] = useState({})
  const [loading, setLoading] = useState(new Set())
  const [baseMap, setBaseMap] = useState('osm') // 'osm' or 'satellite'
  const [mapCenter, setMapCenter] = useState(PAKISTAN_CENTER)
  const [mapZoom, setMapZoom] = useState(PAKISTAN_ZOOM)
  const activeLayersRef = useRef(activeLayers)
  const layerDataRef = useRef({})
  const loadingRef = useRef(new Set())

  // Notify parent when layerData changes
  useEffect(() => {
    if (onLayerDataChange) {
      onLayerDataChange(layerData)
    }
  }, [layerData, onLayerDataChange])

  // Helper function to generate a unique feature ID (must match LayerDataDashboard)
  const getFeatureId = (feature, layerId) => {
    const props = feature.properties || {}
    
    // For wildlife occurrence, use Species + coordinates
    if (layerId === 'wildlife-occurrence') {
      return `${props.Species || 'unknown'}_${props.X_Longi}_${props.Y_Lati}`
    }
    
    // For other layers, try common ID fields
    if (props.WDPAID) return `${layerId}_${props.WDPAID}`
    if (props.SitRecID) return `${layerId}_${props.SitRecID}`
    if (props.Ramsar_Sit) return `${layerId}_${props.Ramsar_Sit}`
    if (props.pk_key) return `${layerId}_${props.pk_key}`
    if (props.OBJECTID) return `${layerId}_${props.OBJECTID}`
    if (props.NAME) return `${layerId}_${props.NAME}_${props.Latitude || props.SitLat || ''}_${props.Longitude || props.SitLong || ''}`
    
    // Fallback: use coordinates if available
    if (feature.geometry && feature.geometry.coordinates) {
      const coords = feature.geometry.coordinates
      if (Array.isArray(coords[0])) {
        return `${layerId}_${coords[0][0]}_${coords[0][1]}`
      }
      return `${layerId}_${coords[0]}_${coords[1]}`
    }
    
    // Last resort: use index (not ideal but works)
    return `${layerId}_${Math.random()}`
  }

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
        // Find layer config to check type
        const layer = layers.find(l => l.id === layerId)
        
        // Skip loading for raster tile layers (they don't need GeoJSON data)
        if (layer && layer.type === 'raster') {
          return
        }
        
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
            // Include region parameter in the API call
            const regionParam = selectedRegion ? `?region=${encodeURIComponent(selectedRegion)}` : ''
            const apiEndpoint = apiUrl ? `${apiUrl}/api/layers/${layerId}${regionParam}` : `/api/layers/${layerId}${regionParam}`
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
  }, [activeLayers, selectedRegion]) // Reload when activeLayers or selectedRegion changes

  // Clear layer data when region changes to force reload with new region
  useEffect(() => {
    console.log(`Region changed to: ${selectedRegion}, clearing layer data to reload with new region`)
    setLayerData({})
    layerDataRef.current = {}
  }, [selectedRegion])

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
    // Special styling for Pakistan District layer - hollow with black outline
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
    
    // Special styling for Gilgit Baltistan Provincial - hollow with purple outline
    if (layer.id === 'gb-provincial') {
      return {
        color: '#8b5cf6', // Purple outline
        weight: 2.5,
        opacity: 1,
        fillColor: 'transparent', // Hollow/transparent fill
        fillOpacity: 0,
        dashArray: undefined
      }
    }
    
    // Special styling for Gilgit Baltistan District - hollow with indigo outline
    if (layer.id === 'gb-district') {
      return {
        color: '#6366f1', // Indigo outline
        weight: 2.5,
        opacity: 1,
        fillColor: 'transparent', // Hollow/transparent fill
        fillOpacity: 0,
        dashArray: undefined
      }
    }
    
    // Special styling for Punjab Provincial - hollow with purple outline
    if (layer.id === 'punjab-provincial') {
      return {
        color: '#8b5cf6', // Purple outline
        weight: 2.5,
        opacity: 1,
        fillColor: 'transparent', // Hollow/transparent fill
        fillOpacity: 0,
        dashArray: undefined
      }
    }
    
    // Special styling for Balochistan Provincial - hollow with purple outline
    if (layer.id === 'balochistan-provincial') {
      return {
        color: '#8b5cf6', // Purple outline
        weight: 2.5,
        opacity: 1,
        fillColor: 'transparent', // Hollow/transparent fill
        fillOpacity: 0,
        dashArray: undefined
      }
    }
    
    // Special styling for Sindh Provincial - hollow with purple outline
    if (layer.id === 'sindh-provincial') {
      return {
        color: '#8b5cf6', // Purple outline
        weight: 2.5,
        opacity: 1,
        fillColor: 'transparent', // Hollow/transparent fill
        fillOpacity: 0,
        dashArray: undefined
      }
    }
    
    // Special styling for Khyber Pakhtunkhwa Provincial - hollow with purple outline
    if (layer.id === 'kp-provincial') {
      return {
        color: '#8b5cf6', // Purple outline
        weight: 2.5,
        opacity: 1,
        fillColor: 'transparent', // Hollow/transparent fill
        fillOpacity: 0,
        dashArray: undefined
      }
    }
    
    // Special styling for AJK Provincial - hollow with purple outline
    if (layer.id === 'ajk-provincial') {
      return {
        color: '#8b5cf6', // Purple outline
        weight: 2.5,
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

  // Helper function to format coordinates
  const formatCoord = (val) => {
    if (val == null) return ''
    const num = typeof val === 'number' ? val : parseFloat(val)
    return isNaN(num) ? val : num.toFixed(6)
  }

  // Format value for display (same as dashboard)
  const formatValue = (value) => {
    if (value === null || value === undefined || value === '') {
      return 'N/A'
    }
    if (typeof value === 'number') {
      if (Number.isInteger(value)) {
        return value.toLocaleString()
      }
      return value.toFixed(6)
    }
    if (typeof value === 'string' && value.length > 100) {
      return value.substring(0, 100) + '...'
    }
    return String(value)
  }

  // Format date value (same as dashboard)
  const formatDate = (value) => {
    if (!value) return 'N/A'
    try {
      const date = new Date(value)
      if (isNaN(date.getTime())) return String(value)
      return date.toLocaleDateString()
    } catch {
      return String(value)
    }
  }

  // Icon mappings for popups (using SVG icons matching Font Awesome)
  const getLayerIconSVG = (layerId) => {
    const icons = {
      'agroecological-zones': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" fill="currentColor" style="width: 16px; height: 16px;"><path d="M546.2 9.7c-5.6-12.5-21.6-13-28.3-1.2C486.9 62.4 431.4 96 368 96h-80C182 96 96 182 96 288c0 7 .8 13.7 1.5 20.5C161.3 262.8 223.5 256 288 256s126.7 6.8 190.5 52.5c.7-6.8 1.5-13.5 1.5-20.5 0-52.2-25-98.2-63.8-127.3 23.7-36.5 55.4-69.9 86.7-100.9 7.4-7.4 11.3-18.1 9.3-28.6zM368 128c27.8 0 53.5 8.6 74.7 23.3-20.2 20.2-42.2 38.2-65.5 54.1-2.7-9.3-4.2-19-4.2-29.4 0-26.5-21.5-48-48-48s-48 21.5-48 48c0 10.4-1.5 20.1-4.2 29.4-23.3-15.9-45.3-33.9-65.5-54.1C314.5 136.6 340.2 128 368 128zM20.6 127.1C7.8 127.1-2.2 141.1.6 154.1c16.5 69.3 65.7 128.1 129 162.1 3.2 1.4 6.9 1.4 10.1 0 63.3-34 112.5-92.8 129-162.1 2.8-13-7.2-27-20-27z"/></svg>', // FaLeaf
      'ecoregions': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" style="width: 16px; height: 16px;"><path d="M442.7 67.3c-11.8-10.7-30.2-10-42.6 0L288 160.9 192 65 64 192l96 95.1 96-95.1 112.1-93.6c12.4-10.3 30.8-10.7 42.6 0 11.8 10.7 12.7 28.2 2 39.5L320 256l96 95.1 96-95.1c10.7-11.3 9.8-28.8-2-39.5z"/></svg>', // FaSeedling
      'kbas': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" fill="currentColor" style="width: 16px; height: 16px;"><path d="M288 0c-69.59 0-126 56.41-126 126 0 56.26 82.35 158.8 113.9 196.02 6.39 7.54 17.82 7.54 24.2 0C331.65 284.8 414 182.26 414 126 414 56.41 357.59 0 288 0zm0 168c-23.2 0-42-18.8-42-42s18.8-42 42-42 42 18.8 42 42-18.8 42-42 42zM20.12 215.95A32.006 32.006 0 0 0 0 245.66v250.32c0 11.32 11.43 19.06 21.94 14.86L160 448V214.92c-8.84-15.98-16.07-31.54-21.25-46.42L20.12 215.95zM288 359.67c-14.07 0-27.38-6.18-36.51-16.96-19.66-23.2-40.57-49.62-57.49-76.72v182.96l192 64V266.15c-16.92 27.1-37.83 53.52-57.49 76.72-9.13 10.78-22.44 16.96-36.51 16.96zm187.33-123.74c-5.18 14.88-12.41 30.44-21.25 46.42V448l138.06 46.2c10.51 4.2 21.94-3.54 21.94-14.86V245.66c0-9.95-5.81-18.89-14.78-22.97l-122.97 41.7z"/></svg>', // FaMapMarkedAlt
      'protected-areas': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" style="width: 16px; height: 16px;"><path d="M466.5 83.7l-192-80a48.15 48.15 0 0 0-36.9 0l-192 80C27.7 91.1 16 108.6 16 128c0 198.5 114.5 335.7 221.5 380.3 11.8 4.9 25.1 4.9 36.9 0C360.1 472.6 496 349.3 496 128c0-19.4-11.7-36.9-29.5-44.3zM256.1 446.3l-.1-381 175.9 73.3c-3.3 151.4-82.1 261.1-175.8 307.7z"/></svg>', // FaShieldAlt
      'protected-areas-pol': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" style="width: 16px; height: 16px;"><path d="M466.5 83.7l-192-80a48.15 48.15 0 0 0-36.9 0l-192 80C27.7 91.1 16 108.6 16 128c0 198.5 114.5 335.7 221.5 380.3 11.8 4.9 25.1 4.9 36.9 0C360.1 472.6 496 349.3 496 128c0-19.4-11.7-36.9-29.5-44.3zM256.1 446.3l-.1-381 175.9 73.3c-3.3 151.4-82.1 261.1-175.8 307.7z"/></svg>', // FaShieldAlt
      'protected-forest': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" fill="currentColor" style="width: 16px; height: 16px;"><path d="M378.2 138.9l-175.1 175.1c-3.1 3.1-8.2 3.1-11.3 0l-175.1-175.1c-3.1-3.1-3.1-8.2 0-11.3l11.3-11.3c3.1-3.1 8.2-3.1 11.3 0L192 280.7l156.9-156.9c3.1-3.1 8.2-3.1 11.3 0l11.3 11.3c3.1 3.1 3.1 8.2 0 11.3z"/></svg>', // FaTree
      'ramsar-sites': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" fill="currentColor" style="width: 16px; height: 16px;"><path d="M327.1 96c-89.97 0-168.54 54.77-212.27 101.63L27.5 131.58c-12.13-9.18-30.24.6-27.14 14.66L24.54 256 .35 365.77c-3.1 14.06 15.01 23.83 27.14 14.66l87.33-66.05C158.56 320.23 237.13 375 327.1 375c96.65 0 175.9-79.23 175.9-175.5C503.1 103.15 423.75 96 327.1 96zm0 32c79.42 0 143.9 64.35 143.9 143.5S406.52 415 327.1 415c-79.42 0-143.9-64.35-143.9-143.5S247.68 128 327.1 128z"/></svg>', // FaWater
      'wildlife-occurrence': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" fill="currentColor" style="width: 16px; height: 16px;"><path d="M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67-9.535 13.774-29.93 13.774-39.464 0zM192 272c44.183 0 80-35.817 80-80s-35.817-80-80-80-80 35.817-80 80 35.817 80 80 80z"/></svg>' // FaMapMarkerAlt
    }
    return icons[layerId] || '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" fill="currentColor" style="width: 16px; height: 16px;"><path d="M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67-9.535 13.774-29.93 13.774-39.464 0zM192 272c44.183 0 80-35.817 80-80s-35.817-80-80-80-80 35.817-80 80 35.817 80 80 80z"/></svg>'
  }

  // Layer column mappings (same as dashboard)
  const layerColumnMappings = {
    'agroecological-zones': {
      columns: ['pk_key', 'pk_name', 'Area', 'AreaWise', 'Label'],
      displayNames: {
        'pk_key': 'Key',
        'pk_name': 'Zone Name',
        'Area': 'Area',
        'AreaWise': 'Area (%)',
        'Label': 'Label'
      }
    },
    'ecoregions': {
      columns: ['ECO_NAME', 'BIOME_NAME', 'REALM', 'ECO_BIOME_', 'NNH_NAME'],
      displayNames: {
        'ECO_NAME': 'Ecoregion Name',
        'BIOME_NAME': 'Biome',
        'REALM': 'Realm',
        'ECO_BIOME_': 'Eco-Biome',
        'NNH_NAME': 'NNH Status'
      }
    },
    'kbas': {
      columns: ['NatName', 'IntName', 'SitLat', 'SitLong', 'SitAreaKM2', 'KbaStatus', 'IbaStatus'],
      displayNames: {
        'NatName': 'National Name',
        'IntName': 'International Name',
        'SitLat': 'Latitude',
        'SitLong': 'Longitude',
        'SitAreaKM2': 'Area (km²)',
        'KbaStatus': 'KBA Status',
        'IbaStatus': 'IBA Status'
      }
    },
    'protected-areas': {
      columns: ['NAME', 'DESIG', 'DESIG_ENG', 'IUCN_CAT', 'STATUS', 'STATUS_YR', 'REP_AREA'],
      displayNames: {
        'NAME': 'Name',
        'DESIG': 'Designation',
        'DESIG_ENG': 'Designation (English)',
        'IUCN_CAT': 'IUCN Category',
        'STATUS': 'Status',
        'STATUS_YR': 'Status Year',
        'REP_AREA': 'Reported Area'
      }
    },
    'protected-areas-pol': {
      columns: ['NAME', 'DESIG', 'DESIG_ENG', 'IUCN_CAT', 'STATUS', 'STATUS_YR', 'GIS_AREA'],
      displayNames: {
        'NAME': 'Name',
        'DESIG': 'Designation',
        'DESIG_ENG': 'Designation (English)',
        'IUCN_CAT': 'IUCN Category',
        'STATUS': 'Status',
        'STATUS_YR': 'Status Year',
        'GIS_AREA': 'GIS Area'
      }
    },
    'protected-forest': {
      columns: ['F_Zone', 'F_Circle', 'F_Div', 'F_Name', 'GPS_Area', 'Gross_Area', 'F_Type', 'Legal_Stat'],
      displayNames: {
        'F_Zone': 'Zone',
        'F_Circle': 'Circle',
        'F_Div': 'Division',
        'F_Name': 'Forest Name',
        'GPS_Area': 'GPS Area',
        'Gross_Area': 'Gross Area',
        'F_Type': 'Forest Type',
        'Legal_Stat': 'Legal Status'
      }
    },
    'ramsar-sites': {
      columns: ['Site_name', 'Name', 'Region', 'Country', 'Designatio', 'Area__ha_', 'Shape_Area', 'Latitude', 'Longitude', 'Wetland_Ty', 'Shape_Leng'],
      displayNames: {
        'Site_name': 'Site Name',
        'Name': 'Site Name',
        'Region': 'Region',
        'Country': 'Country',
        'Designatio': 'Designation Date',
        'Area__ha_': 'Area (ha)',
        'Shape_Area': 'Area (sq units)',
        'Latitude': 'Latitude',
        'Longitude': 'Longitude',
        'Wetland_Ty': 'Wetland Type',
        'Shape_Leng': 'Perimeter/Length'
      }
    },
    'wildlife-occurrence': {
      columns: ['Species', 'Common_nam', 'X_Longi', 'Y_Lati'],
      displayNames: {
        'Species': 'Species',
        'Common_nam': 'Common Name',
        'X_Longi': 'Longitude',
        'Y_Lati': 'Latitude'
      }
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
      const layerId = layerConfig.id
      const columnMapping = layerColumnMappings[layerId]
      
      let popupContent = ''
      
      // Use column mappings if available, otherwise show all properties
      if (columnMapping) {
        const { columns, displayNames } = columnMapping
        // Filter to only show columns that exist in the feature
        // For ramsar-sites, prefer 'Name' over 'Site_name' if both exist
        let visibleColumns = columns.filter(col => props[col] != null)
        if (layerId === 'ramsar-sites' && props['Name'] && props['Site_name']) {
          visibleColumns = visibleColumns.filter(col => col !== 'Site_name')
        }
        
        if (visibleColumns.length > 0) {
          const icon = getLayerIconSVG(layerId)
        popupContent = `
            <div style="width: 380px; padding: 0; margin: 0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.2); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;">
              <div style="background: ${layerConfig.color}; padding: 10px 12px; color: white; margin: 0;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div style="background: rgba(255,255,255,0.25); padding: 6px; border-radius: 6px; display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; line-height: 1; flex-shrink: 0; color: white;">
                    ${icon}
                  </div>
                  <h3 style="font-weight: bold; margin: 0; font-size: 14px; color: white; flex: 1; line-height: 1.2; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${layerConfig.name}</h3>
                </div>
              </div>
              <div style="background: white; padding: 10px 12px; max-height: 400px; overflow-y: auto; margin: 0;">
                ${visibleColumns.map(col => {
                  const value = props[col]
                  let displayValue = formatValue(value)
                  // Format dates specially
                  if (col === 'Designatio' && value) {
                    displayValue = formatDate(value)
                  }
                  // Format Shape_Area to be more readable
                  if (col === 'Shape_Area' && typeof value === 'number') {
                    displayValue = value.toFixed(8) + ' sq units'
                  }
                  // Format Shape_Leng to be more readable
                  if (col === 'Shape_Leng' && typeof value === 'number') {
                    displayValue = value.toFixed(6) + ' units'
                  }
                  // Truncate long values
                  if (typeof displayValue === 'string' && displayValue.length > 40) {
                    displayValue = displayValue.substring(0, 40) + '...'
                  }
                  // Escape HTML to prevent XSS
                  const safeValue = String(displayValue).replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
                  const safeLabel = String(displayNames[col] || col).replace(/</g, '&lt;').replace(/>/g, '&gt;')
                  return `<div style="margin: 4px 0; padding: 4px 0; border-bottom: 1px solid #e5e7eb; display: flex; align-items: flex-start; gap: 8px;">
                    <strong style="color: #6b7280; font-weight: 600; min-width: 130px; font-size: 11px; flex-shrink: 0;">${safeLabel}:</strong>
                    <span style="color: #1f2937; font-weight: 500; flex: 1; word-break: break-word; line-height: 1.4; font-size: 11px;">${safeValue}</span>
                  </div>`
                }).join('')}
              </div>
            </div>
          `
        } else {
          // Fallback if no mapped columns have values
          const icon = getLayerIconSVG(layerId)
          popupContent = `
            <div style="width: 300px; padding: 0; margin: 0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.2); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;">
              <div style="background: ${layerConfig.color}; padding: 10px 12px; color: white; margin: 0;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div style="background: rgba(255,255,255,0.25); padding: 6px; border-radius: 6px; display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; line-height: 1; flex-shrink: 0; color: white;">
                    ${icon}
                  </div>
                  <h3 style="font-weight: bold; margin: 0; font-size: 14px; color: white; flex: 1; line-height: 1.2; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${layerConfig.name}</h3>
                </div>
              </div>
              <div style="background: white; padding: 20px; margin: 0;">
                <div style="font-size: 12px; color: #6b7280; text-align: center;">No data available</div>
            </div>
          </div>
        `
        }
      } else {
        // For layers without mappings, show first 10 properties
        const allKeys = Object.keys(props).slice(0, 10)
        const icon = getLayerIconSVG(layerId)
        if (allKeys.length > 0) {
          popupContent = `
            <div style="width: 380px; padding: 0; margin: 0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.2); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;">
              <div style="background: ${layerConfig.color}; padding: 10px 12px; color: white; margin: 0;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div style="background: rgba(255,255,255,0.25); padding: 6px; border-radius: 6px; display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; line-height: 1; flex-shrink: 0; color: white;">
                    ${icon}
                  </div>
                  <h3 style="font-weight: bold; margin: 0; font-size: 14px; color: white; flex: 1; line-height: 1.2; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${layerConfig.name}</h3>
                </div>
              </div>
              <div style="background: white; padding: 10px 12px; max-height: 400px; overflow-y: auto; margin: 0;">
                ${allKeys.map(key => {
                  const value = formatValue(props[key])
                  // Truncate long values
                  const displayValue = typeof value === 'string' && value.length > 40 ? value.substring(0, 40) + '...' : value
                  // Escape HTML to prevent XSS
                  const safeValue = String(displayValue).replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
                  const safeKey = String(key).replace(/</g, '&lt;').replace(/>/g, '&gt;')
                  return `<div style="margin: 4px 0; padding: 4px 0; border-bottom: 1px solid #e5e7eb; display: flex; align-items: flex-start; gap: 8px;">
                    <strong style="color: #6b7280; font-weight: 600; min-width: 130px; font-size: 11px; flex-shrink: 0;">${safeKey}:</strong>
                    <span style="color: #1f2937; font-weight: 500; flex: 1; word-break: break-word; line-height: 1.4; font-size: 11px;">${safeValue}</span>
                  </div>`
                }).join('')}
              </div>
            </div>
          `
        } else {
          const iconNoData = getLayerIconSVG(layerId)
        popupContent = `
            <div style="width: 300px; padding: 0; margin: 0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.2); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;">
              <div style="background: ${layerConfig.color}; padding: 10px 12px; color: white; margin: 0;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div style="background: rgba(255,255,255,0.25); padding: 6px; border-radius: 6px; display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; line-height: 1; flex-shrink: 0; color: white;">
                    ${iconNoData}
                  </div>
                  <h3 style="font-weight: bold; margin: 0; font-size: 14px; color: white; flex: 1; line-height: 1.2; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${layerConfig.name}</h3>
                </div>
              </div>
              <div style="background: white; padding: 20px; margin: 0;">
                <div style="font-size: 12px; color: #6b7280; text-align: center;">No data available</div>
          </div>
        </div>
      `
      }
      }
      
      layer.bindPopup(popupContent, {
        className: 'custom-popup',
        maxWidth: 400,
        autoPan: true,
        closeButton: true,
        autoClose: true,
        keepInView: true
      })
      
      // Add click handler to notify parent of feature selection
      layer.on('click', (e) => {
        if (onFeatureSelect) {
          const featureId = getFeatureId(feature, layerConfig.id)
          onFeatureSelect({
            layerId: layerConfig.id,
            featureId: featureId,
            feature: feature
          })
        }
      })
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
        <MapResizer panelOpen={panelOpen} />
        <RegionZoomController selectedRegion={selectedRegion} layerData={layerData} activeLayers={activeLayers} />
        <ForestTypesZoomController activeLayers={activeLayers} />
        
        {Array.from(activeLayers).map((layerId) => {
          const layer = layers.find(l => l.id === layerId)
          
          if (!layer) {
            console.warn(`Layer ${layerId}: Missing layer config`)
            return null
          }
          
          // Handle WMS layers
          if (layer.type === 'wms' && layer.wmsUrl) {
            return (
              <WMSOverlay
                key={layerId}
                layerId={layerId}
                wmsUrl={layer.wmsUrl}
                wmsLayers={layer.wmsLayers}
                wmsFormat={layer.wmsFormat || 'image/png'}
                wmsVersion={layer.wmsVersion || '1.1.0'}
                opacity={layer.opacity || 0.9}
                attribution={layer.name}
              />
            )
          }
          
          // Handle raster tile layers
          if (layer.type === 'raster' && layer.tiles) {
            // Check if it's an external URL (starts with http:// or https://)
            const isExternalUrl = layer.tiles.startsWith('http://') || layer.tiles.startsWith('https://')
            const tileUrl = isExternalUrl 
              ? layer.tiles 
              : (import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}${layer.tiles}` : layer.tiles)
            
            // Use MBTilesOverlay for LULC layers and forest types (external MBTiles), regular TileLayer for local tiles
            if (isExternalUrl && (layerId === 'punjab-lulc' || layerId === 'pakistan-lulc' || layerId === 'sindh-lulc' || layerId === 'balochistan-lulc' || layerId === 'forest-types')) {
              console.log(`Rendering MBTiles overlay for ${layerId}:`, tileUrl)
              return (
                <MBTilesOverlay
                  key={layerId}
                  layerId={layerId}
                  tileUrl={tileUrl}
                  opacity={layer.opacity || 0.9}
                  isActive={true}
                />
              )
            }
            
            return (
              <TileLayer
                key={layerId}
                url={tileUrl}
                attribution={layer.name}
                opacity={layer.opacity || 0.7}
                zIndex={100}
              />
            )
          }
          
          // Handle GeoJSON layers (existing logic)
          const data = layerData[layerId]
          const isLoading = loading.has(layerId)
          
          // If layer is loading, don't render yet (avoid race condition warnings)
          if (isLoading) {
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
      <Legend layers={activeLayersList} activeLayers={activeLayers} selectedRegion={selectedRegion} />
    </div>
  )
}

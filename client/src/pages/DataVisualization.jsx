import { useState, useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend as RechartsLegend,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts'
import { FaFilter, FaTimes } from 'react-icons/fa'
import LoadingSpinner from '../components/LoadingSpinner'
import MapLegend from '../components/Legend'
import 'leaflet/dist/leaflet.css'

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Color palette for charts
const CHART_COLORS = [
  '#22c55e', '#16a34a', '#3b82f6', '#6366f1', '#f59e0b', '#f97316',
  '#06b6d4', '#8b5cf6', '#ef4444', '#14b8a6', '#ec4899', '#84cc16',
]

// Helper function to convert UI region name to backend region name
const getBackendRegionName = (region) => {
  return region === 'AJK' ? 'Azad Kashmir' : region
}

// Regions available for filtering (UI display names)
const REGIONS = ['National', 'Gilgit Baltistan', 'Punjab', 'Sindh', 'Balochistan', 'Khyber Pakhtunkhwa', 'AJK']

// Layer availability by region
const LAYER_AVAILABILITY = {
  'wildlife-occurrence': ['Punjab'],
  'protected-areas-sindh': ['Sindh'],
  'ramsar-sites-sindh': ['Sindh'],
  'forest-landscape-sindh': ['Sindh'],
  'agroecological-zones': ['National', 'Gilgit Baltistan', 'Punjab', 'Sindh', 'Balochistan', 'Khyber Pakhtunkhwa'], // Exclude AJK
}

// Layer colors and styles
const LAYER_STYLES = {
  'agroecological-zones': { color: '#22c55e', weight: 1.5, fillOpacity: 0.3 },
  'ecoregions': { color: '#6366f1', weight: 1.5, fillOpacity: 0.3 },
  'kbas': { color: '#3b82f6', weight: 2, fillOpacity: 0.4 },
  'protected-areas': { color: '#f59e0b', weight: 1, fillOpacity: 0 },
  'protected-areas-pol': { color: '#f97316', weight: 1.5, fillOpacity: 0.3 },
  'protected-forest': { color: '#22c55e', weight: 1.5, fillOpacity: 0.3 },
  'ramsar-sites': { color: '#06b6d4', weight: 1, fillOpacity: 0 },
  'wildlife-occurrence': { color: '#ef4444', weight: 1, fillOpacity: 0 },
  'protected-areas-sindh': { color: '#f97316', weight: 1.5, fillOpacity: 0.3 },
  'ramsar-sites-sindh': { color: '#06b6d4', weight: 1, fillOpacity: 0 },
}

// Get boundary layer ID for region
function getBoundaryLayerId(region) {
  const boundaryMap = {
    'Gilgit Baltistan': 'gb-district',
    'Punjab': 'punjab-provincial',
    'Sindh': 'sindh-provincial',
    'Balochistan': 'balochistan-provincial',
    'Khyber Pakhtunkhwa': 'kp-provincial',
    'AJK': 'ajk-provincial',
    'Azad Kashmir': 'ajk-provincial', // Backend compatibility
    'National': 'pakistan-provinces'
  }
  return boundaryMap[region] || 'pakistan-provinces'
}

// Create custom marker icon for point data
function createCustomIcon(color) {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4);"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  })
}

// Component to zoom to province boundary and handle feature highlighting
function RegionZoomController({ selectedRegion, boundaryData, mapLayerData, highlightedLayer, highlightedFeature }) {
  const map = useMap()
  
  useEffect(() => {
    // Resize map when component mounts
    setTimeout(() => {
      map.invalidateSize()
    }, 100)

    if (!boundaryData || !boundaryData.features || boundaryData.features.length === 0) {
      // Default to Pakistan view
      map.setView([30.3753, 69.3451], 6, { animate: true })
      return
    }

    // If a specific feature is highlighted, zoom to it
    if (highlightedFeature && highlightedLayer && mapLayerData[highlightedLayer]) {
      const data = mapLayerData[highlightedLayer]
      const bounds = L.latLngBounds([])
      
      // Find matching features based on layer type
      const matchingFeatures = data.features.filter(f => {
        const props = f.properties || {}
        let name = null
        
        // Different property names for different layers
        if (highlightedLayer === 'agroecological-zones') {
          name = props.pk_name
        } else if (highlightedLayer === 'ecoregions') {
          name = props.BIOME_NAME
        } else if (highlightedLayer === 'kbas') {
          name = props.NatName || props.IntName
        } else if (highlightedLayer === 'protected-areas-pol' || highlightedLayer === 'protected-areas' || highlightedLayer === 'protected-areas-sindh') {
          // For Protected Areas, match by IUCN category
          name = props.IUCN_CAT || 'Not Assigned'
        } else if (highlightedLayer === 'protected-forest') {
          // For Protected Forest, match by zone
          name = props.F_Zone
        } else if (highlightedLayer === 'ramsar-sites' || highlightedLayer === 'ramsar-sites-sindh') {
          // For Ramsar Sites, match by region
          name = props.Region
        } else if (highlightedLayer === 'wildlife-occurrence') {
          // For Wildlife Occurrence, match by species
          name = props.Species || props.Common_nam
        } else {
          // Fallback to common property names
          name = props.NAME || props.Site_name || props.NatName
        }
        
        return name === highlightedFeature
      })
      
      // Extract coordinates from all matching features
      matchingFeatures.forEach(feature => {
        if (feature && feature.geometry) {
          const extractCoords = (coords) => {
            if (Array.isArray(coords[0])) {
              coords.forEach(c => extractCoords(c))
            } else if (coords.length === 2 && typeof coords[0] === 'number') {
              bounds.extend([coords[1], coords[0]])
            }
          }
          extractCoords(feature.geometry.coordinates)
        }
      })
      
      if (bounds.isValid()) {
        map.fitBounds(bounds, { 
          padding: [100, 100],
          maxZoom: 10,
          animate: true,
          duration: 0.8
        })
        return
      }
    }

    // Calculate bounds from GeoJSON features
    const bounds = L.latLngBounds([])
    
    boundaryData.features.forEach(feature => {
      if (feature.geometry && feature.geometry.coordinates) {
        const extractCoords = (coords) => {
          if (Array.isArray(coords[0])) {
            coords.forEach(c => extractCoords(c))
          } else if (coords.length === 2 && typeof coords[0] === 'number') {
            bounds.extend([coords[1], coords[0]])
          }
        }
        extractCoords(feature.geometry.coordinates)
      }
    })
    
    // Also include bounds from data layers
    Object.values(mapLayerData).forEach(data => {
      if (data && data.features) {
        data.features.forEach(feature => {
          if (feature.geometry && feature.geometry.coordinates) {
            const extractCoords = (coords) => {
              if (Array.isArray(coords[0])) {
                coords.forEach(c => extractCoords(c))
              } else if (coords.length === 2 && typeof coords[0] === 'number') {
                bounds.extend([coords[1], coords[0]])
              }
            }
            extractCoords(feature.geometry.coordinates)
          }
        })
      }
    })
    
    if (bounds.isValid()) {
      setTimeout(() => {
        map.fitBounds(bounds, { 
          padding: [50, 50],
          maxZoom: selectedRegion === 'National' ? 6 : 8,
          animate: true,
          duration: 0.8
        })
      }, 300)
    }
  }, [boundaryData, selectedRegion, map, mapLayerData, highlightedLayer, highlightedFeature])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setTimeout(() => {
        map.invalidateSize()
      }, 100)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [map])

  return null
}

function DataVisualization() {
  const [layers, setLayers] = useState([])
  const [layerData, setLayerData] = useState({})
  const [mapLayerData, setMapLayerData] = useState({})
  const [boundaryData, setBoundaryData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedRegion, setSelectedRegion] = useState('National')
  const [highlightedLayer, setHighlightedLayer] = useState(null)
  const [highlightedFeature, setHighlightedFeature] = useState(null)

  // Fetch layers configuration
  useEffect(() => {
    const fetchLayers = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || ''
        const apiEndpoint = apiUrl ? `${apiUrl}/api/layers` : '/api/layers'
        const response = await fetch(apiEndpoint)
        if (!response.ok) throw new Error(`Failed to fetch layers: ${response.status}`)
        const data = await response.json()
        setLayers(data)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching layers:', err)
        setError(err.message)
        setLoading(false)
      }
    }
    fetchLayers()
  }, [])

  // Fetch boundary data when region changes
  useEffect(() => {
    const fetchBoundary = async () => {
      const boundaryLayerId = getBoundaryLayerId(selectedRegion)
      const backendRegion = getBackendRegionName(selectedRegion)
      try {
        const apiUrl = import.meta.env.VITE_API_URL || ''
        const endpoint = apiUrl 
          ? `${apiUrl}/api/layers/${boundaryLayerId}?region=${encodeURIComponent(backendRegion)}` 
          : `/api/layers/${boundaryLayerId}?region=${encodeURIComponent(backendRegion)}`
        const response = await fetch(endpoint)
        if (response.ok) {
          const data = await response.json()
          setBoundaryData(data)
        } else {
          setBoundaryData(null)
        }
      } catch (err) {
        console.error(`Error fetching boundary for ${selectedRegion}:`, err)
        setBoundaryData(null)
      }
    }
    fetchBoundary()
  }, [selectedRegion])

  // Fetch data layers for map and charts when region changes
  useEffect(() => {
    if (layers.length > 0) {
      const backendRegion = getBackendRegionName(selectedRegion)
      fetchAllLayerData(layers, backendRegion)
    }
  }, [selectedRegion, layers])

  // Fetch data for all layers
  const fetchAllLayerData = async (layersList, region) => {
    setLoading(true)
    
    // Layers to show on map
    // Exclude point layers (protected-areas, wildlife-occurrence) for National level
    const mapLayers = region === 'National'
      ? [
          'agroecological-zones',
          'ecoregions',
          'kbas',
          'protected-areas-pol',
          'protected-forest',
          'ramsar-sites',
          'protected-areas-sindh',
          'ramsar-sites-sindh',
        ]
      : [
          'agroecological-zones',
          'ecoregions',
          'kbas',
          'protected-areas',
          'protected-areas-pol',
          'protected-forest',
          'ramsar-sites',
          'wildlife-occurrence',
          'protected-areas-sindh',
          'ramsar-sites-sindh',
        ]

    const geoJsonLayers = layersList.filter(layer => {
      if (layer.type === 'raster') return false
      if (layer.id === 'pakistan-provinces') return false
      if (layer.id.includes('-lulc')) return false
      if (layer.id.includes('-provincial')) return false
      if (layer.id.includes('-district')) return false
      
      const availableRegions = LAYER_AVAILABILITY[layer.id]
      if (availableRegions && !availableRegions.includes(region)) return false
      
      return true
    })

    const dataPromises = geoJsonLayers.map(async (layer) => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || ''
        const endpoint = apiUrl 
          ? `${apiUrl}/api/layers/${layer.id}?region=${encodeURIComponent(region)}` 
          : `/api/layers/${layer.id}?region=${encodeURIComponent(region)}`
        const response = await fetch(endpoint)
        if (response.ok) {
          const data = await response.json()
          return { layerId: layer.id, data }
        }
        return { layerId: layer.id, data: null }
      } catch (err) {
        console.error(`Error fetching data for ${layer.id}:`, err)
        return { layerId: layer.id, data: null }
      }
    })

    const results = await Promise.all(dataPromises)
    const dataMap = {}
    const mapDataMap = {}
    
    results.forEach(({ layerId, data }) => {
      if (data && data.features && data.features.length > 0) {
        dataMap[layerId] = data
        // Add to map data if it's a layer we want to display
        if (mapLayers.includes(layerId)) {
          mapDataMap[layerId] = data
        }
      }
    })
    
    setLayerData(dataMap)
    setMapLayerData(mapDataMap)
    setLoading(false)
  }

  // Process data functions
  const agroecologicalData = useMemo(() => {
    const data = layerData['agroecological-zones']
    if (!data || !data.features) return null
    const zoneMap = {}
    data.features.forEach(feature => {
      const props = feature.properties || {}
      const zoneName = props.pk_name || 'Unknown'
      const area = parseFloat(props.Area) || 0
      const areaPercent = parseFloat(props.AreaWise) || 0
      if (!zoneMap[zoneName]) {
        zoneMap[zoneName] = { name: zoneName, area: 0, areaPercent: 0 }
      }
      zoneMap[zoneName].area += area
      zoneMap[zoneName].areaPercent += areaPercent
    })
    return Object.values(zoneMap).sort((a, b) => b.area - a.area)
  }, [layerData])

  const ecoregionsData = useMemo(() => {
    const data = layerData['ecoregions']
    if (!data || !data.features || data.features.length === 0) return null
    const biomeMap = {}
    data.features.forEach(feature => {
      const props = feature.properties || {}
      const biome = props.BIOME_NAME || 'Unknown'
      biomeMap[biome] = (biomeMap[biome] || 0) + 1
    })
    const byBiome = Object.entries(biomeMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)
    if (byBiome.length === 0) return null
    return { byBiome }
  }, [layerData])

  const kbasData = useMemo(() => {
    const data = layerData['kbas']
    if (!data || !data.features || data.features.length === 0) return null
    const areaMap = {}
    data.features.forEach(feature => {
      const props = feature.properties || {}
      const name = props.NatName || props.IntName || 'Unknown'
      const area = parseFloat(props.SitAreaKM2) || 0
      if (area > 0) {
        areaMap[name] = (areaMap[name] || 0) + area
      }
    })
    const byArea = Object.entries(areaMap)
      .map(([name, area]) => ({ name, area: parseFloat(area.toFixed(2)) }))
      .sort((a, b) => b.area - a.area)
      .slice(0, 15)
    if (byArea.length === 0) return null
    return { byArea }
  }, [layerData])

  const protectedAreasData = useMemo(() => {
    const pointsData = layerData['protected-areas']
    const polygonsData = layerData['protected-areas-pol']
    const sindhData = layerData['protected-areas-sindh']
    const iucnMap = {}
    const allData = [pointsData, polygonsData, sindhData].filter(Boolean)
    allData.forEach(data => {
      if (data && data.features) {
        data.features.forEach(feature => {
          const props = feature.properties || {}
          const iucn = props.IUCN_CAT || 'Not Assigned'
          iucnMap[iucn] = (iucnMap[iucn] || 0) + 1
        })
      }
    })
    if (Object.keys(iucnMap).length === 0) return null
    return {
      byIUCN: Object.entries(iucnMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
    }
  }, [layerData])

  const protectedForestData = useMemo(() => {
    const data = layerData['protected-forest']
    if (!data || !data.features || data.features.length === 0) return null
    const zoneMap = {}
    data.features.forEach(feature => {
      const props = feature.properties || {}
      const zone = props.F_Zone || 'Unknown'
      const area = parseFloat(props.GPS_Area) || parseFloat(props.Gross_Area) || 0
      if (area > 0) {
        zoneMap[zone] = (zoneMap[zone] || 0) + area
      }
    })
    const byZone = Object.entries(zoneMap)
      .map(([name, area]) => ({ name, area: parseFloat(area.toFixed(2)) }))
      .sort((a, b) => b.area - a.area)
    if (byZone.length === 0) return null
    return { byZone }
  }, [layerData])

  const ramsarData = useMemo(() => {
    const data = layerData['ramsar-sites'] || layerData['ramsar-sites-sindh']
    if (!data || !data.features || data.features.length === 0) return null
    const regionMap = {}
    data.features.forEach(feature => {
      const props = feature.properties || {}
      const region = props.Region || 'Unknown'
      const area = parseFloat(props.Area__ha_) || 0
      if (area > 0) {
        regionMap[region] = (regionMap[region] || 0) + area
      }
    })
    const byRegion = Object.entries(regionMap)
      .map(([name, area]) => ({ name, area: parseFloat(area.toFixed(2)) }))
      .sort((a, b) => b.area - a.area)
    if (byRegion.length === 0) return null
    return { byRegion }
  }, [layerData])

  const wildlifeData = useMemo(() => {
    if (selectedRegion !== 'Punjab') return null
    const data = layerData['wildlife-occurrence']
    if (!data || !data.features) return null
    const speciesMap = {}
    data.features.forEach(feature => {
      const props = feature.properties || {}
      const species = props.Species || props.Common_nam || 'Unknown'
      speciesMap[species] = (speciesMap[species] || 0) + 1
    })
    return Object.entries(speciesMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20)
  }, [layerData, selectedRegion])

  // Process data for Biodiversity Conservation Metrics Radar Chart
  const biodiversityMetricsData = useMemo(() => {
    // Calculate raw values
    const protectedAreasCount = protectedAreasData?.byIUCN?.reduce((sum, item) => sum + item.value, 0) || 0
    const kbasCount = kbasData?.byArea?.length || 0
    const protectedForestArea = protectedForestData?.byZone?.reduce((sum, item) => sum + item.area, 0) || 0
    const ramsarCount = ramsarData?.byRegion?.length || 0
    const ecoregionsCount = ecoregionsData?.byBiome?.reduce((sum, item) => sum + item.count, 0) || 0
    const speciesCount = wildlifeData?.length || 0

    // Normalize values to 0-100 scale
    // Using reasonable maximums based on typical values across Pakistan
    const normalize = (value, max) => Math.min(100, Math.round((value / max) * 100))
    
    const metrics = [
      { metric: 'P.Areas', value: normalize(protectedAreasCount, 1000), fullMark: 100 },
      { metric: 'KBAs', value: normalize(kbasCount, 50), fullMark: 100 },
      { metric: 'P.Forest', value: normalize(protectedForestArea, 1000000), fullMark: 100 }, // 1M hectares
      { metric: 'Ramsar', value: normalize(ramsarCount, 25), fullMark: 100 },
      { metric: 'Eco_Reg', value: normalize(ecoregionsCount, 20), fullMark: 100 },
      { metric: 'Species', value: normalize(speciesCount, 100), fullMark: 100 }
    ]

    // Only return if we have at least some data
    const hasData = metrics.some(m => m.value > 0)
    return hasData ? metrics : null
  }, [protectedAreasData, kbasData, protectedForestData, ramsarData, ecoregionsData, wildlifeData])

  // Get boundary layer style
  const getBoundaryStyle = () => {
    if (selectedRegion === 'National') {
      return { color: '#000000', weight: 2, opacity: 1, fillColor: 'transparent', fillOpacity: 0 }
    }
    return { color: '#8b5cf6', weight: 2.5, opacity: 1, fillColor: 'transparent', fillOpacity: 0 }
  }

  // Get layer style for map
  const getLayerStyle = (layerId, feature = null) => {
    const baseStyle = LAYER_STYLES[layerId] || { color: '#22c55e', weight: 1.5, fillOpacity: 0.3 }
    
    // Highlight if this feature is selected
    if (feature && highlightedFeature && highlightedLayer === layerId) {
      const props = feature.properties || {}
      let name = null
      
      // Different property names for different layers (same logic as RegionZoomController)
      if (highlightedLayer === 'agroecological-zones') {
        name = props.pk_name
      } else if (highlightedLayer === 'ecoregions') {
        name = props.BIOME_NAME
      } else if (highlightedLayer === 'kbas') {
        name = props.NatName || props.IntName
      } else if (highlightedLayer === 'protected-areas-pol' || highlightedLayer === 'protected-areas' || highlightedLayer === 'protected-areas-sindh') {
        // For Protected Areas, match by IUCN category
        name = props.IUCN_CAT || 'Not Assigned'
      } else if (highlightedLayer === 'protected-forest') {
        // For Protected Forest, match by zone
        name = props.F_Zone
      } else if (highlightedLayer === 'ramsar-sites' || highlightedLayer === 'ramsar-sites-sindh') {
        // For Ramsar Sites, match by region
        name = props.Region
      } else if (highlightedLayer === 'wildlife-occurrence') {
        // For Wildlife Occurrence, match by species
        name = props.Species || props.Common_nam
      } else {
        // Fallback to common property names
        name = props.NAME || props.Site_name || props.NatName
      }
      
      if (name === highlightedFeature) {
        return {
          ...baseStyle,
          weight: baseStyle.weight + 2,
          fillOpacity: baseStyle.fillOpacity + 0.3,
          color: '#ff0000',
          opacity: 1
        }
      }
    }
    
    // Dim other layers if one is highlighted
    if (highlightedLayer && highlightedLayer !== layerId) {
      return {
        ...baseStyle,
        fillOpacity: baseStyle.fillOpacity * 0.3,
        opacity: 0.4
      }
    }
    
    return baseStyle
  }

  // Handle chart click to navigate to map
  const handleChartClick = (layerId, featureName) => {
    if (highlightedLayer === layerId && highlightedFeature === featureName) {
      // Clear selection if clicking the same item
      setHighlightedLayer(null)
      setHighlightedFeature(null)
    } else { 
      setHighlightedLayer(layerId)
      setHighlightedFeature(featureName)
    }
  }

  // Enhanced click handler for better sensitivity
  const handleBarClick = (layerId, event) => {
    // Try multiple ways to get the data
    let data = null
    if (event?.activePayload?.[0]?.payload) {
      data = event.activePayload[0].payload
    } else if (event?.payload) {
      data = event.payload
    } else if (event?.activeLabel) {
      // Fallback: try to find data by label
      return
    }
    
    if (data && data.name) {
      handleChartClick(layerId, data.name)
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Data</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  // Split charts into left and right panels
  const leftCharts = [
    { title: 'Agroecological Zones - Area Distribution by Zone', data: agroecologicalData, type: 'pie' },
    { title: 'Ecoregions - Count by Biome Type', data: ecoregionsData, type: 'bar' },
    { title: 'Key Biodiversity Areas - Area by Site (km²)', data: kbasData, type: 'bar-horizontal' },
  ]

  const rightCharts = [
    { title: 'Biodiversity Conservation Metrics', data: biodiversityMetricsData, type: 'radar' },
    { title: 'Protected Areas - Count by IUCN Category', data: protectedAreasData, type: 'bar' },
    { title: 'Protected Forest - Area by Zone (hectares)', data: protectedForestData, type: 'bar' },
    { title: 'Ramsar Sites - Area by Region (hectares)', data: ramsarData, type: 'bar' },
    { title: 'Wildlife Occurrence - Count by Species', data: wildlifeData, type: 'bar-horizontal' },
  ]

  return (
    <>
      <style>{`
        .chart-panel::-webkit-scrollbar {
          width: 6px;
        }
        .chart-panel::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }
        .chart-panel::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        .chart-panel::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        .chart-panel {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 #f1f5f9;
        }
        .chart-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          box-shadow: 
            0 4px 6px -1px rgba(0, 0, 0, 0.1),
            0 2px 4px -1px rgba(0, 0, 0, 0.06),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.8);
        }
        .chart-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #22c55e 0%, #16a34a 50%, #22c55e 100%);
          border-radius: 12px 12px 0 0;
          opacity: 0.6;
        }
        .chart-card:hover {
          transform: translateY(-4px) perspective(1000px) rotateX(2deg);
          box-shadow: 
            0 20px 25px -5px rgba(34, 197, 94, 0.2),
            0 10px 10px -5px rgba(34, 197, 94, 0.1),
            0 0 0 1px rgba(34, 197, 94, 0.1),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.9);
        }
        .chart-card-3d {
          transform-style: preserve-3d;
        }
        .bar-3d {
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15));
          transition: all 0.3s ease;
        }
        .bar-3d:hover {
          filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.25));
          transform: translateZ(5px);
        }
        .pie-3d {
          filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
        }
        /* Increase clickable area for bars */
        .recharts-bar-rectangle {
          cursor: pointer !important;
          min-height: 8px !important;
          transition: all 0.2s ease;
        }
        .recharts-bar-rectangle:hover {
          opacity: 0.9 !important;
          filter: brightness(1.1);
        }
        /* Increase clickable area for pie chart segments */
        .recharts-sector {
          cursor: pointer !important;
          transition: all 0.2s ease;
        }
        .recharts-sector:hover {
          opacity: 0.9 !important;
          filter: brightness(1.1);
        }
        /* Make entire chart area more clickable */
        .recharts-wrapper {
          cursor: default;
        }
        .recharts-cartesian-grid-horizontal line,
        .recharts-cartesian-grid-vertical line {
          pointer-events: none;
        }
        /* Increase hit area for small bars */
        .recharts-bar {
          min-width: 4px;
        }
        /* Better click handling for small bars - ensure minimum clickable size */
        .recharts-bar-rectangle {
          min-height: 12px !important;
          min-width: 12px !important;
        }
        /* For very small bars, make them more visible and clickable */
        .recharts-bar-rectangle[height="0"],
        .recharts-bar-rectangle[width="0"] {
          min-height: 20px !important;
          min-width: 20px !important;
          opacity: 0.4 !important;
        }
        .recharts-bar-rectangle[height="0"]:hover,
        .recharts-bar-rectangle[width="0"]:hover {
          opacity: 0.8 !important;
          filter: brightness(1.2);
        }
        /* Increase padding around bars for easier clicking */
        .recharts-bar-rectangle {
          padding: 2px;
          margin: 1px;
        }
        /* Make entire bar area clickable, not just the visible part */
        .recharts-bar {
          pointer-events: all;
        }
      `}</style>
      <div className="min-h-screen bg-gray-50">
        {/* Filter Bar */}
        <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
          <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-center flex-wrap gap-3">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 text-gray-700">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <FaFilter className="text-green-600 text-base" />
                  </div>
                  <span className="font-semibold text-sm">Filter by Region:</span>
                </div>
                <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1 overflow-x-auto">
                  {REGIONS.map((region) => (
                    <button
                      key={region}
                      onClick={() => {
                        setSelectedRegion(region)
                        setHighlightedLayer(null)
                        setHighlightedFeature(null)
                      }}
                      className={`px-3 py-1.5 rounded-md font-medium text-xs sm:text-sm transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                        selectedRegion === region
                          ? 'bg-white text-green-600 shadow-sm border border-green-200'
                          : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                      }`}
                    >
                      {region}
                    </button>
                  ))}
                </div>
              </div>
              {highlightedLayer && highlightedFeature && (
                <button
                  onClick={() => {
                    setHighlightedLayer(null)
                    setHighlightedFeature(null)
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 border border-red-200 transition-all duration-200 text-sm font-medium shadow-sm"
                >
                  <FaTimes className="text-sm" />
                  <span>Clear Selection</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Three Column Layout: Left Charts | Map | Right Charts */}
        <div className="flex" style={{ height: 'calc(100vh - 120px)', minHeight: 'calc(100vh - 120px)' }}>
          {/* Left Panel - Charts with scrollbar */}
          <div className="bg-white border-r border-gray-200 overflow-y-auto chart-panel" style={{ width: '27.5%', height: '100%', maxHeight: '100%' }}>
            <div className="p-3 space-y-3">
              {leftCharts.map((chart, idx) => {
                if (!chart.data) return null
                
                if (chart.type === 'pie' && chart.data.length > 0) {
                    return (
                    <div key={idx} className="chart-card chart-card-3d rounded-xl border border-gray-200 p-3 hover:border-green-300">
                      <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 shadow-sm"></div>
                        {chart.title}
                      </h3>
                      <ResponsiveContainer width="100%" height={320}>
                        <PieChart className="pie-3d">
                          <Pie
                            data={chart.data}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={false}
                            outerRadius={95}
                            innerRadius={30}
                            fill="#8884d8"
                            dataKey="area"
                            onClick={(data) => handleChartClick('agroecological-zones', data.name)}
                            style={{ cursor: 'pointer' }}
                          >
                            {chart.data.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={CHART_COLORS[index % CHART_COLORS.length]}
                                style={{ 
                                  opacity: highlightedFeature === entry.name && highlightedLayer === 'agroecological-zones' ? 1 : 0.85,
                                  stroke: highlightedFeature === entry.name && highlightedLayer === 'agroecological-zones' ? '#ff0000' : 'white',
                                  strokeWidth: highlightedFeature === entry.name && highlightedLayer === 'agroecological-zones' ? 3 : 2
                                }}
                              />
                            ))}
                          </Pie>
                          <Tooltip 
                            animationDuration={0}
                            formatter={(value, name, props) => {
                              const payload = props.payload || {}
                              return [
                                `Area: ${value.toLocaleString()} km²`,
                                `Percentage: ${payload.areaPercent?.toFixed(1) || 0}%`
                              ]
                            }}
                            labelFormatter={(label) => `Zone: ${label}`}
                            contentStyle={{ 
                              backgroundColor: 'rgba(255, 255, 255, 0.98)',
                              border: '2px solid #22c55e',
                              borderRadius: '8px',
                              padding: '12px',
                              fontSize: '13px',
                              fontWeight: '500',
                              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                            }}
                          />
                          <RechartsLegend 
                            wrapperStyle={{ paddingTop: '8px', fontSize: '9px' }}
                            formatter={(value) => {
                              // Show only zone name, truncate if too long
                              return value.length > 20 ? `${value.substring(0, 17)}...` : value
                            }}
                            iconType="square"
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )
                }
                
                if (chart.type === 'bar' && chart.data.byBiome && chart.data.byBiome.length > 0) {
                    return (
                    <div key={idx} className="chart-card chart-card-3d rounded-xl border border-gray-200 p-3 hover:border-green-300">
                      <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center">
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-2 shadow-sm"></div>
                        {chart.title}
                      </h3>
                      <ResponsiveContainer width="100%" height={320}>
                        <BarChart data={chart.data.byBiome}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} fontSize={11} stroke="#6b7280" />
                          <YAxis fontSize={11} stroke="#6b7280" />
                          <Tooltip 
                            animationDuration={0}
                            formatter={(value) => [`${value.toLocaleString()}`, 'Count']}
                            labelFormatter={(label) => `Biome: ${label}`}
                            contentStyle={{ 
                              backgroundColor: 'rgba(255, 255, 255, 0.98)',
                              border: '1px solid #22c55e',
                              borderRadius: '6px',
                              padding: '10px',
                              fontSize: '12px',
                              fontWeight: '500'
                            }}
                          />
                          <Bar 
                            dataKey="count" 
                            fill={CHART_COLORS[2]}
                            radius={[6, 6, 0, 0]}
                            className="bar-3d"
                            onClick={(event) => handleBarClick('ecoregions', event)}
                            onMouseEnter={(event) => {
                              if (event.target) {
                                event.target.style.cursor = 'pointer'
                                event.target.style.opacity = '0.9'
                              }
                            }}
                            onMouseLeave={(event) => {
                              if (event.target) {
                                event.target.style.opacity = '0.85'
                              }
                            }}
                            style={{ cursor: 'pointer' }}
                          >
                            {chart.data.byBiome.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`}
                                fill={highlightedFeature === entry.name && highlightedLayer === 'ecoregions' ? '#ff0000' : CHART_COLORS[2]}
                                fillOpacity={highlightedFeature === entry.name && highlightedLayer === 'ecoregions' ? 1 : 0.85}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )
                }
                
                if (chart.type === 'bar-horizontal' && chart.data.byArea && chart.data.byArea.length > 0) {
                    return (
                    <div key={idx} className="chart-card chart-card-3d rounded-xl border border-gray-200 p-3 hover:border-green-300">
                      <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2 shadow-sm"></div>
                        {chart.title}
                      </h3>
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={chart.data.byArea} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis 
                            type="number" 
                            fontSize={11} 
                            stroke="#6b7280"
                            domain={[0, 'dataMax']}
                            ticks={(() => {
                              // Calculate max value and create ticks at 500 intervals
                              const maxValue = Math.max(...chart.data.byArea.map(d => d.area || 0))
                              const maxTick = Math.ceil(maxValue / 500) * 500
                              const ticks = []
                              for (let i = 0; i <= maxTick; i += 500) {
                                ticks.push(i)
                              }
                              return ticks
                            })()}
                          />
                          <YAxis 
                            dataKey="name" 
                            type="category" 
                            width={140} 
                            fontSize={9} 
                            stroke="#6b7280"
                            tickFormatter={(value) => {
                              // Truncate long names and show only key parts
                              if (value.length > 25) {
                                // Try to keep important parts (National Park, Wildlife Sanctuary, etc.)
                                const important = value.match(/(National Park|Wildlife Sanctuary|Wetlands|Valley|Delta|Desert)/i)
                                if (important) {
                                  const index = value.indexOf(important[0])
                                  return value.substring(0, 22) + '...'
                                }
                                return value.substring(0, 22) + '...'
                              }
                              return value
                            }}
                          />
                          <Tooltip 
                            animationDuration={0}
                            formatter={(value) => `${value.toLocaleString()} km²`}
                            labelFormatter={(label) => label}
                            contentStyle={{ 
                              backgroundColor: 'rgba(255, 255, 255, 0.98)',
                              border: '1px solid #22c55e',
                              borderRadius: '6px',
                              padding: '8px',
                              fontSize: '12px',
                              maxWidth: '300px'
                            }}
                          />
                          <Bar 
                            dataKey="area" 
                            fill={CHART_COLORS[3]}
                            radius={[0, 6, 6, 0]}
                            className="bar-3d"
                            onClick={(event) => handleBarClick('kbas', event)}
                            onMouseEnter={(event) => {
                              if (event.target) {
                                event.target.style.cursor = 'pointer'
                                event.target.style.opacity = '0.9'
                              }
                            }}
                            onMouseLeave={(event) => {
                              if (event.target) {
                                event.target.style.opacity = '0.85'
                              }
                            }}
                            style={{ cursor: 'pointer' }}
                          >
                            {chart.data.byArea.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`}
                                fill={highlightedFeature === entry.name && highlightedLayer === 'kbas' ? '#ff0000' : CHART_COLORS[3]}
                                fillOpacity={highlightedFeature === entry.name && highlightedLayer === 'kbas' ? 1 : 0.85}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )
                }
                
                return null
              })}
            </div>
          </div>

          {/* Center Panel - Map */}
          <div className="border-r border-gray-200 relative bg-white" style={{ width: '45%', height: '100%', maxHeight: '100%' }}>
            <MapContainer
              center={[30.3753, 69.3451]}
              zoom={6}
              style={{ height: '100%', width: '100%' }}
              zoomControl={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {/* Province Boundary */}
              {boundaryData && boundaryData.features && (
                <GeoJSON
                  key={`boundary-${selectedRegion}`}
                  data={boundaryData}
                  style={getBoundaryStyle()}
                />
              )}
              
              {/* Data Layers on Map */}
              {Object.entries(mapLayerData).map(([layerId, data]) => {
                if (!data || !data.features) return null
                
                const style = getLayerStyle(layerId)
                
                // Handle point layers
                if (data.features[0]?.geometry?.type === 'Point') {
                  return (
                    <div key={layerId}>
                      {data.features.map((feature, idx) => {
                        if (feature.geometry && feature.geometry.type === 'Point') {
                          const coords = feature.geometry.coordinates
                          const props = feature.properties || {}
                          const name = props.NAME || props.Site_name || props.Species || layerId
                          
                          return (
                            <Marker
                              key={`${layerId}-${idx}`}
                              position={[coords[1], coords[0]]}
                              icon={createCustomIcon(style.color)}
                            >
                              <Popup>
                                <div className="text-sm">
                                  <strong>{name}</strong>
                                  {props.DESIG && <div>Designation: {props.DESIG}</div>}
                                  {props.Species && <div>Species: {props.Species}</div>}
                                </div>
                              </Popup>
                            </Marker>
                          )
                        }
                        return null
                      })}
                    </div>
                  )
                }
                
                // Handle polygon/line layers
                return (
                  <GeoJSON
                    key={layerId}
                    data={data}
                    style={(feature) => {
                      const featureStyle = getLayerStyle(layerId, feature)
                      return {
                        color: featureStyle.color,
                        weight: featureStyle.weight,
                        fillColor: featureStyle.color,
                        fillOpacity: featureStyle.fillOpacity,
                        opacity: featureStyle.opacity || 0.8
                      }
                    }}
                  />
                )
              })}
              
              <RegionZoomController 
                selectedRegion={selectedRegion} 
                boundaryData={boundaryData} 
                mapLayerData={mapLayerData}
                highlightedLayer={highlightedLayer}
                highlightedFeature={highlightedFeature}
              />
            </MapContainer>
            
            {/* Map Legend */}
            {layers.length > 0 && (() => {
              const activeLayersSet = new Set(Object.keys(mapLayerData))
              // Add boundary layer to active layers for legend
              if (boundaryData && boundaryData.features && boundaryData.features.length > 0) {
                const boundaryLayerId = getBoundaryLayerId(selectedRegion)
                activeLayersSet.add(boundaryLayerId)
              }
              return (
                <MapLegend 
                  layers={layers} 
                  activeLayers={activeLayersSet} 
                />
              )
            })()}
          </div>

          {/* Right Panel - Charts with scrollbar */}
          <div className="bg-white overflow-y-auto chart-panel" style={{ width: '27.5%', height: '100%', maxHeight: '100%' }}>
            <div className="p-3 space-y-3">
              {rightCharts.map((chart, idx) => {
                if (!chart.data) return null
                
                if (chart.type === 'radar' && chart.data && chart.data.length > 0) {
                  return (
                    <div key={idx} className="chart-card chart-card-3d rounded-xl border border-gray-200 p-3 hover:border-green-300">
                      <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2 shadow-sm"></div>
                        {chart.title}
                      </h3>
                      <div className="text-xs text-gray-500 mb-2">Environmental performance indicators</div>
                      <ResponsiveContainer width="100%" height={350}>
                        <RadarChart data={chart.data} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                          <PolarGrid stroke="#e5e7eb" />
                          <PolarAngleAxis 
                            dataKey="metric" 
                            tick={{ fontSize: 10, fill: '#6b7280', fontWeight: '500' }}
                            tickFormatter={(value) => {
                              // Use even shorter labels
                              const shortLabels = {
                                'P.Areas': 'P.Areas',
                                'KBAs': 'KBAs',
                                'P.Forest': 'P.Forest',
                                'Ramsar': 'Ramsar',
                                'Eco_Reg': 'Eco_Reg',
                                'Species': 'Species'
                              }
                              return shortLabels[value] || value
                            }}
                          />
                          <PolarRadiusAxis 
                            angle={90} 
                            domain={[0, 100]} 
                            tick={{ fontSize: 9, fill: '#9ca3af' }}
                            tickCount={5}
                          />
                          <Radar
                            name="Conservation Metrics"
                            dataKey="value"
                            stroke="#22c55e"
                            fill="#22c55e"
                            fillOpacity={0.6}
                            strokeWidth={2}
                          />
                          <Tooltip
                            cursor={{ stroke: '#22c55e', strokeWidth: 1 }}
                            animationDuration={0}
                            formatter={(value) => [`${value}%`, 'Score']}
                            labelFormatter={(label) => {
                              // Map abbreviations to full names for tooltip
                              const fullNames = {
                                'P.Areas': 'Protected Areas',
                                'KBAs': 'Key Biodiversity Areas',
                                'P.Forest': 'Protected Forest',
                                'Ramsar': 'Ramsar Sites',
                                'Eco_Reg': 'Ecoregions',
                                'Species': 'Species Richness'
                              }
                              return `Metric: ${fullNames[label] || label}`
                            }}
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.98)',
                              border: '1px solid #22c55e',
                              borderRadius: '6px',
                              padding: '10px',
                              fontSize: '12px',
                              fontWeight: '500',
                              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                            }}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  )
                }
                
                if (chart.type === 'bar' && chart.data.byIUCN && chart.data.byIUCN.length > 0) {
                    return (
                    <div key={idx} className="chart-card chart-card-3d rounded-xl border border-gray-200 p-3 hover:border-green-300">
                      <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center">
                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-2 shadow-sm"></div>
                        {chart.title}
                      </h3>
                      <ResponsiveContainer width="100%" height={320}>
                        <BarChart data={chart.data.byIUCN}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} fontSize={11} stroke="#6b7280" />
                          <YAxis fontSize={11} stroke="#6b7280" />
                          <Tooltip 
                            animationDuration={0}
                            formatter={(value) => [`${value.toLocaleString()}`, 'Count']}
                            labelFormatter={(label) => `IUCN Category: ${label}`}
                            contentStyle={{ 
                              backgroundColor: 'rgba(255, 255, 255, 0.98)',
                              border: '1px solid #22c55e',
                              borderRadius: '6px',
                              padding: '10px',
                              fontSize: '12px',
                              fontWeight: '500'
                            }}
                          />
                          <Bar 
                            dataKey="value" 
                            fill={CHART_COLORS[4]}
                            radius={[6, 6, 0, 0]}
                            className="bar-3d"
                            onClick={(event) => handleBarClick('protected-areas-pol', event)}
                            onMouseEnter={(event) => {
                              if (event.target) {
                                event.target.style.cursor = 'pointer'
                                event.target.style.opacity = '0.9'
                              }
                            }}
                            onMouseLeave={(event) => {
                              if (event.target) {
                                event.target.style.opacity = '0.85'
                              }
                            }}
                            style={{ cursor: 'pointer' }}
                          >
                            {chart.data.byIUCN.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`}
                                fill={highlightedFeature === entry.name && highlightedLayer === 'protected-areas-pol' ? '#ff0000' : CHART_COLORS[4]}
                                fillOpacity={highlightedFeature === entry.name && highlightedLayer === 'protected-areas-pol' ? 1 : 0.85}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )
                }
                
                if (chart.type === 'bar' && chart.data.byZone && chart.data.byZone.length > 0) {
                    return (
                    <div key={idx} className="chart-card chart-card-3d rounded-xl border border-gray-200 p-3 hover:border-green-300">
                      <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 shadow-sm"></div>
                        {chart.title}
                      </h3>
                      <ResponsiveContainer width="100%" height={320}>
                        <BarChart data={chart.data.byZone}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} fontSize={11} stroke="#6b7280" />
                          <YAxis fontSize={11} stroke="#6b7280" />
                          <Tooltip 
                            animationDuration={0}
                            formatter={(value) => [`${value.toLocaleString()} hectares`, 'Area']}
                            labelFormatter={(label) => `Zone: ${label}`}
                            contentStyle={{ 
                              backgroundColor: 'rgba(255, 255, 255, 0.98)',
                              border: '1px solid #22c55e',
                              borderRadius: '6px',
                              padding: '10px',
                              fontSize: '12px',
                              fontWeight: '500'
                            }}
                          />
                          <Bar 
                            dataKey="area" 
                            fill={CHART_COLORS[0]}
                            radius={[6, 6, 0, 0]}
                            className="bar-3d"
                            onClick={(event) => handleBarClick('protected-forest', event)}
                            onMouseEnter={(event) => {
                              if (event.target) {
                                event.target.style.cursor = 'pointer'
                                event.target.style.opacity = '0.9'
                              }
                            }}
                            onMouseLeave={(event) => {
                              if (event.target) {
                                event.target.style.opacity = '0.85'
                              }
                            }}
                            style={{ cursor: 'pointer' }}
                          >
                            {chart.data.byZone.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`}
                                fill={highlightedFeature === entry.name && highlightedLayer === 'protected-forest' ? '#ff0000' : CHART_COLORS[0]}
                                fillOpacity={highlightedFeature === entry.name && highlightedLayer === 'protected-forest' ? 1 : 0.85}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )
                }
                
                if (chart.type === 'bar' && chart.data.byRegion && chart.data.byRegion.length > 0) {
                    return (
                    <div key={idx} className="chart-card chart-card-3d rounded-xl border border-gray-200 p-3 hover:border-green-300">
                      <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center">
                        <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full mr-2 shadow-sm"></div>
                        {chart.title}
                      </h3>
                      <ResponsiveContainer width="100%" height={320}>
                        <BarChart data={chart.data.byRegion}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} fontSize={11} stroke="#6b7280" />
                          <YAxis fontSize={11} stroke="#6b7280" />
                          <Tooltip 
                            animationDuration={0}
                            formatter={(value) => [`${value.toLocaleString()} hectares`, 'Area']}
                            labelFormatter={(label) => `Region: ${label}`}
                            contentStyle={{ 
                              backgroundColor: 'rgba(255, 255, 255, 0.98)',
                              border: '1px solid #22c55e',
                              borderRadius: '6px',
                              padding: '10px',
                              fontSize: '12px',
                              fontWeight: '500'
                            }}
                          />
                          <Bar 
                            dataKey="area" 
                            fill={CHART_COLORS[6]}
                            radius={[6, 6, 0, 0]}
                            className="bar-3d"
                            onClick={(event) => handleBarClick('ramsar-sites', event)}
                            onMouseEnter={(event) => {
                              if (event.target) {
                                event.target.style.cursor = 'pointer'
                                event.target.style.opacity = '0.9'
                              }
                            }}
                            onMouseLeave={(event) => {
                              if (event.target) {
                                event.target.style.opacity = '0.85'
                              }
                            }}
                            style={{ cursor: 'pointer' }}
                          >
                            {chart.data.byRegion.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`}
                                fill={highlightedFeature === entry.name && highlightedLayer === 'ramsar-sites' ? '#ff0000' : CHART_COLORS[6]}
                                fillOpacity={highlightedFeature === entry.name && highlightedLayer === 'ramsar-sites' ? 1 : 0.85}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )
                }
                
                if (chart.type === 'bar-horizontal' && chart.data && chart.data.length > 0) {
                    return (
                    <div key={idx} className="chart-card chart-card-3d rounded-xl border border-gray-200 p-3 hover:border-green-300">
                      <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2 shadow-sm"></div>
                        {chart.title}
                      </h3>
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={chart.data} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis type="number" fontSize={11} stroke="#6b7280" />
                          <YAxis dataKey="name" type="category" width={110} fontSize={10} stroke="#6b7280" />
                          <Tooltip 
                            animationDuration={0}
                            formatter={(value) => [`${value.toLocaleString()}`, 'Occurrences']}
                            labelFormatter={(label) => `Species: ${label}`}
                            contentStyle={{ 
                              backgroundColor: 'rgba(255, 255, 255, 0.98)',
                              border: '1px solid #22c55e',
                              borderRadius: '6px',
                              padding: '10px',
                              fontSize: '12px',
                              fontWeight: '500'
                            }}
                          />
                          <Bar 
                            dataKey="count" 
                            fill={CHART_COLORS[8]}
                            radius={[0, 6, 6, 0]}
                            className="bar-3d"
                            onClick={(event) => handleBarClick('wildlife-occurrence', event)}
                            onMouseEnter={(event) => {
                              if (event.target) {
                                event.target.style.cursor = 'pointer'
                                event.target.style.opacity = '0.9'
                              }
                            }}
                            onMouseLeave={(event) => {
                              if (event.target) {
                                event.target.style.opacity = '0.85'
                              }
                            }}
                            style={{ cursor: 'pointer' }}
                          >
                            {chart.data.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`}
                                fill={highlightedFeature === entry.name && highlightedLayer === 'wildlife-occurrence' ? '#ff0000' : CHART_COLORS[8]}
                                fillOpacity={highlightedFeature === entry.name && highlightedLayer === 'wildlife-occurrence' ? 1 : 0.85}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )
                }
                
                return null
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default DataVisualization

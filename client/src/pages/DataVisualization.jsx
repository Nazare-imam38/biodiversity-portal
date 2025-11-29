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
  Legend,
  ResponsiveContainer
} from 'recharts'
import { FaChartBar, FaFilter, FaTimes } from 'react-icons/fa'
import LoadingSpinner from '../components/LoadingSpinner'
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

// Regions available for filtering
const REGIONS = ['National', 'Gilgit Baltistan', 'Punjab', 'Sindh', 'Balochistan', 'Khyber Pakhtunkhwa', 'Azad Kashmir']

// Layer availability by region
const LAYER_AVAILABILITY = {
  'wildlife-occurrence': ['Punjab'],
  'protected-areas-sindh': ['Sindh'],
  'ramsar-sites-sindh': ['Sindh'],
  'forest-landscape-sindh': ['Sindh'],
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
    'Azad Kashmir': 'ajk-provincial',
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
      const feature = data.features.find(f => {
        const props = f.properties || {}
        const name = props.pk_name || props.BIOME_NAME || props.NatName || props.NAME || props.Site_name || props.Species
        return name === highlightedFeature
      })
      
      if (feature && feature.geometry) {
        const bounds = L.latLngBounds([])
        const extractCoords = (coords) => {
          if (Array.isArray(coords[0])) {
            coords.forEach(c => extractCoords(c))
          } else if (coords.length === 2 && typeof coords[0] === 'number') {
            bounds.extend([coords[1], coords[0]])
          }
        }
        extractCoords(feature.geometry.coordinates)
        
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
      try {
        const apiUrl = import.meta.env.VITE_API_URL || ''
        const endpoint = apiUrl 
          ? `${apiUrl}/api/layers/${boundaryLayerId}?region=${encodeURIComponent(selectedRegion)}` 
          : `/api/layers/${boundaryLayerId}?region=${encodeURIComponent(selectedRegion)}`
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
      fetchAllLayerData(layers, selectedRegion)
    }
  }, [selectedRegion, layers])

  // Fetch data for all layers
  const fetchAllLayerData = async (layersList, region) => {
    setLoading(true)
    
    // Layers to show on map
    const mapLayers = [
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
      const name = props.pk_name || props.BIOME_NAME || props.NatName || props.NAME || props.Site_name || props.Species
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
    { title: 'Agroecological Zones', data: agroecologicalData, type: 'pie' },
    { title: 'Ecoregions', data: ecoregionsData, type: 'bar' },
    { title: 'Key Biodiversity Areas', data: kbasData, type: 'bar-horizontal' },
  ]

  const rightCharts = [
    { title: 'Protected Areas', data: protectedAreasData, type: 'bar' },
    { title: 'Protected Forest', data: protectedForestData, type: 'bar' },
    { title: 'Ramsar Sites', data: ramsarData, type: 'bar' },
    { title: 'Wildlife Occurrence', data: wildlifeData, type: 'bar-horizontal' },
  ]

  return (
    <>
      <style>{`
        .chart-panel::-webkit-scrollbar {
          width: 8px;
        }
        .chart-panel::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        .chart-panel::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .chart-panel::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        .chart-panel {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 #f1f5f9;
        }
      `}</style>
      <div className="min-h-screen bg-gray-50">
        {/* Page Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-3">
            <div className="bg-green-600 p-3 rounded-lg">
              <FaChartBar className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Data Visualization</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-gray-700">
                <FaFilter className="text-lg" />
                <span className="font-semibold">Filter by Region:</span>
              </div>
              <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1 overflow-x-auto">
                {REGIONS.map((region) => (
                  <button
                    key={region}
                    onClick={() => {
                      setSelectedRegion(region)
                      setHighlightedLayer(null)
                      setHighlightedFeature(null)
                    }}
                    className={`px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 whitespace-nowrap ${
                      selectedRegion === region
                        ? 'bg-white text-green-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
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
                className="flex items-center space-x-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
              >
                <FaTimes />
                <span>Clear Selection</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Three Column Layout: Left Charts | Map | Right Charts */}
      <div className="flex" style={{ height: 'calc(100vh - 180px)', minHeight: 'calc(100vh - 180px)' }}>
        {/* Left Panel - Charts with scrollbar */}
        <div className="w-1/3 bg-white border-r border-gray-200 overflow-y-auto chart-panel" style={{ height: '100%', maxHeight: '100%' }}>
          <div className="p-6 space-y-8">
            {leftCharts.map((chart, idx) => {
              if (!chart.data) return null
              
              if (chart.type === 'pie' && chart.data.length > 0) {
                return (
                  <div key={idx} className="bg-gray-50 rounded-lg p-6 shadow-sm">
                    <h3 className="text-base font-bold text-gray-800 mb-4">{chart.title}</h3>
                    <ResponsiveContainer width="100%" height={400}>
                      <PieChart>
                        <Pie
                          data={chart.data}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, areaPercent, area }) => {
                            // Show percentage prominently with area
                            return `${areaPercent.toFixed(1)}%\n${area.toLocaleString()} km²`
                          }}
                          outerRadius={110}
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
                                opacity: highlightedFeature === entry.name && highlightedLayer === 'agroecological-zones' ? 1 : 0.8,
                                stroke: highlightedFeature === entry.name && highlightedLayer === 'agroecological-zones' ? '#ff0000' : 'white',
                                strokeWidth: highlightedFeature === entry.name && highlightedLayer === 'agroecological-zones' ? 3 : 2
                              }}
                            />
                          ))}
                        </Pie>
                        <Tooltip 
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
                            borderRadius: '6px',
                            padding: '10px',
                            fontSize: '13px',
                            fontWeight: '500'
                          }}
                        />
                        <Legend 
                          wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}
                          formatter={(value, entry) => {
                            const data = chart.data.find(d => d.name === value)
                            if (data) {
                              return `${value}\n${data.areaPercent.toFixed(1)}% (${data.area.toLocaleString()} km²)`
                            }
                            return value
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
                  <div key={idx} className="bg-gray-50 rounded-lg p-6 shadow-sm">
                    <h3 className="text-base font-bold text-gray-800 mb-4">{chart.title}</h3>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={chart.data.byBiome}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip />
                        <Bar 
                          dataKey="count" 
                          fill={CHART_COLORS[2]}
                          onClick={(data) => {
                            if (data && data.name) handleChartClick('ecoregions', data.name)
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          {chart.data.byBiome.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`}
                              fill={highlightedFeature === entry.name && highlightedLayer === 'ecoregions' ? '#ff0000' : CHART_COLORS[2]}
                              fillOpacity={highlightedFeature === entry.name && highlightedLayer === 'ecoregions' ? 1 : 0.8}
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
                  <div key={idx} className="bg-gray-50 rounded-lg p-6 shadow-sm">
                    <h3 className="text-base font-bold text-gray-800 mb-4">{chart.title}</h3>
                    <ResponsiveContainer width="100%" height={500}>
                      <BarChart data={chart.data.byArea} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" fontSize={12} />
                        <YAxis dataKey="name" type="category" width={120} fontSize={11} />
                        <Tooltip formatter={(value) => `${value.toLocaleString()} km²`} />
                        <Bar 
                          dataKey="area" 
                          fill={CHART_COLORS[3]}
                          onClick={(data) => {
                            if (data && data.name) handleChartClick('kbas', data.name)
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          {chart.data.byArea.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`}
                              fill={highlightedFeature === entry.name && highlightedLayer === 'kbas' ? '#ff0000' : CHART_COLORS[3]}
                              fillOpacity={highlightedFeature === entry.name && highlightedLayer === 'kbas' ? 1 : 0.8}
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
        <div className="w-1/3 border-r border-gray-200 relative" style={{ height: '100%', maxHeight: '100%' }}>
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
        </div>

        {/* Right Panel - Charts with scrollbar */}
        <div className="w-1/3 bg-white overflow-y-auto chart-panel" style={{ height: '100%', maxHeight: '100%' }}>
          <div className="p-6 space-y-8">
            {rightCharts.map((chart, idx) => {
              if (!chart.data) return null
              
              if (chart.type === 'bar' && chart.data.byIUCN && chart.data.byIUCN.length > 0) {
                return (
                  <div key={idx} className="bg-gray-50 rounded-lg p-6 shadow-sm">
                    <h3 className="text-base font-bold text-gray-800 mb-4">{chart.title}</h3>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={chart.data.byIUCN}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip />
                        <Bar 
                          dataKey="value" 
                          fill={CHART_COLORS[4]}
                          onClick={(data) => {
                            if (data && data.name) handleChartClick('protected-areas-pol', data.name)
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          {chart.data.byIUCN.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`}
                              fill={highlightedFeature === entry.name && highlightedLayer === 'protected-areas-pol' ? '#ff0000' : CHART_COLORS[4]}
                              fillOpacity={highlightedFeature === entry.name && highlightedLayer === 'protected-areas-pol' ? 1 : 0.8}
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
                  <div key={idx} className="bg-gray-50 rounded-lg p-6 shadow-sm">
                    <h3 className="text-base font-bold text-gray-800 mb-4">{chart.title}</h3>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={chart.data.byZone}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip formatter={(value) => `${value.toLocaleString()}`} />
                        <Bar 
                          dataKey="area" 
                          fill={CHART_COLORS[0]}
                          onClick={(data) => {
                            if (data && data.name) handleChartClick('protected-forest', data.name)
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          {chart.data.byZone.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`}
                              fill={highlightedFeature === entry.name && highlightedLayer === 'protected-forest' ? '#ff0000' : CHART_COLORS[0]}
                              fillOpacity={highlightedFeature === entry.name && highlightedLayer === 'protected-forest' ? 1 : 0.8}
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
                  <div key={idx} className="bg-gray-50 rounded-lg p-6 shadow-sm">
                    <h3 className="text-base font-bold text-gray-800 mb-4">{chart.title}</h3>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={chart.data.byRegion}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip formatter={(value) => `${value.toLocaleString()} ha`} />
                        <Bar 
                          dataKey="area" 
                          fill={CHART_COLORS[6]}
                          onClick={(data) => {
                            if (data && data.name) handleChartClick('ramsar-sites', data.name)
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          {chart.data.byRegion.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`}
                              fill={highlightedFeature === entry.name && highlightedLayer === 'ramsar-sites' ? '#ff0000' : CHART_COLORS[6]}
                              fillOpacity={highlightedFeature === entry.name && highlightedLayer === 'ramsar-sites' ? 1 : 0.8}
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
                  <div key={idx} className="bg-gray-50 rounded-lg p-6 shadow-sm">
                    <h3 className="text-base font-bold text-gray-800 mb-4">{chart.title}</h3>
                    <ResponsiveContainer width="100%" height={500}>
                      <BarChart data={chart.data} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" fontSize={12} />
                        <YAxis dataKey="name" type="category" width={120} fontSize={11} />
                        <Tooltip />
                        <Bar 
                          dataKey="count" 
                          fill={CHART_COLORS[8]}
                          onClick={(data) => {
                            if (data && data.name) handleChartClick('wildlife-occurrence', data.name)
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          {chart.data.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`}
                              fill={highlightedFeature === entry.name && highlightedLayer === 'wildlife-occurrence' ? '#ff0000' : CHART_COLORS[8]}
                              fillOpacity={highlightedFeature === entry.name && highlightedLayer === 'wildlife-occurrence' ? 1 : 0.8}
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

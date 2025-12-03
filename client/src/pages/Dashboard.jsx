import { useState, useEffect } from 'react'
import { FaBars, FaTimes } from 'react-icons/fa'
import MapView from '../components/MapView'
import LayerPanel from '../components/LayerPanel'
import LoadingSpinner from '../components/LoadingSpinner'
import StatisticsCards from '../components/StatisticsCards'
import FeaturedLayers from '../components/FeaturedLayers'
import PartnersSection from '../components/PartnersSection'
import ScrollToFooter from '../components/ScrollToFooter'
import LayerDataDashboard from '../components/LayerDataDashboard'

function Dashboard() {
  const [layers, setLayers] = useState([])
  const [activeLayers, setActiveLayers] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [layerData, setLayerData] = useState({})
  const [isMobile, setIsMobile] = useState(false)
  const [selectedFeature, setSelectedFeature] = useState(null)
  
  // Handler to receive layerData from MapView
  const handleLayerDataChange = (data) => {
    setLayerData(data)
  }
  
  // Handler to receive feature selection from MapView
  const handleFeatureSelect = (featureInfo) => {
    setSelectedFeature(featureInfo)
  }
  const [isLayerPanelOpen, setIsLayerPanelOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024
    }
    return true
  })
  const [selectedRegion, setSelectedRegion] = useState('KP') // Default to KP to show KP provincial layer
  
  // Helper function to convert UI region name to backend region name
  const getBackendRegionName = (region) => {
    if (region === 'AJK') return 'Azad Kashmir'
    if (region === 'KP') return 'Khyber Pakhtunkhwa'
    return region
  }

  // Define all regions (UI display names)
  const regions = ['National', 'Gilgit Baltistan', 'Punjab', 'Sindh', 'Balochistan', 'AJK', 'KP']

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    fetchLayers()
  }, [])

  // Store active layers per region to maintain independent state
  const [regionActiveLayers, setRegionActiveLayers] = useState({})
  
  // Automatically toggle region boundary layer and clear all layers except defaults when region changes
  useEffect(() => {
    if (layers.length === 0) return // Wait for layers to load
    
    // Save current active layers for the previous region before switching
    // This will be handled by the region change effect
    
    // When region changes, restore that region's saved layers or start fresh with defaults
    setActiveLayers(prev => {
      // Get saved layers for the new region, or start with defaults
      const savedLayers = regionActiveLayers[selectedRegion] || new Set()
      
      // Always include pakistan-provinces as default
      const defaultLayers = new Set(['pakistan-provinces'])
      
      // Define region-specific boundary layers that should be auto-activated
      if (selectedRegion === 'Gilgit Baltistan') {
        defaultLayers.add('gb-district')
      } else if (selectedRegion === 'Punjab') {
        defaultLayers.add('punjab-provincial')
      } else if (selectedRegion === 'Balochistan') {
        defaultLayers.add('balochistan-provincial')
      } else if (selectedRegion === 'Sindh') {
        defaultLayers.add('sindh-provincial')
      } else if (selectedRegion === 'KP') {
        defaultLayers.add('kp-provincial')
      } else if (selectedRegion === 'AJK') {
        defaultLayers.add('ajk-provincial')
      }
      
      // Merge saved layers with defaults, but prioritize defaults for boundary layers
      const newSet = new Set(defaultLayers)
      
      // Add back saved layers that are not region-specific boundaries
      savedLayers.forEach(layerId => {
        // Don't restore region-specific boundary layers (they're handled above)
        if (layerId !== 'gb-district' && layerId !== 'gb-provincial' && 
            layerId !== 'punjab-provincial' && layerId !== 'balochistan-provincial' && 
            layerId !== 'sindh-provincial' && layerId !== 'kp-provincial' && 
            layerId !== 'ajk-provincial' && layerId !== 'pakistan-provinces') {
          newSet.add(layerId)
        }
      })
      
      console.log(`Restored layers for ${selectedRegion}:`, Array.from(newSet))
      return newSet
    })
  }, [selectedRegion, layers])
  
  // Save active layers for current region whenever they change
  useEffect(() => {
    if (selectedRegion && activeLayers.size > 0) {
      setRegionActiveLayers(prev => ({
        ...prev,
        [selectedRegion]: new Set(activeLayers)
      }))
      console.log(`Saved layers for ${selectedRegion}:`, Array.from(activeLayers))
    }
  }, [activeLayers, selectedRegion])

  const fetchLayers = async () => {
    try {
      // Use relative URL when served from same domain, otherwise use env var or localhost
      const apiUrl = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? '' : 'http://localhost:3001')
      const apiEndpoint = apiUrl ? `${apiUrl}/api/layers` : '/api/layers'
      console.log(`Fetching layers from ${apiEndpoint}`)
      const response = await fetch(apiEndpoint)
      if (!response.ok) {
        throw new Error(`Failed to fetch layers: ${response.status} ${response.statusText}`)
      }
      const data = await response.json()
      console.log('Fetched layers:', data.length, 'layers found')
      console.log('Layer IDs:', data.map(l => l.id))
      
      // Check for LULC layers
      const punjabLULC = data.find(l => l.id === 'punjab-lulc')
      const pakistanLULC = data.find(l => l.id === 'pakistan-lulc')
      console.log('Punjab LULC layer:', punjabLULC ? 'Found' : 'NOT FOUND', punjabLULC)
      console.log('Pakistan LULC layer:', pakistanLULC ? 'Found' : 'NOT FOUND', pakistanLULC)
      
      if (!data || data.length === 0) {
        throw new Error('No layers returned from server')
      }
      
      setLayers(data)
      
      // Activate default layers (provinces layer)
      const defaultLayers = new Set()
      data.forEach(layer => {
        if (layer.default) {
          console.log('Activating default layer:', layer.id, layer.name)
          defaultLayers.add(layer.id)
        }
      })
      
      if (defaultLayers.size > 0) {
        console.log('Default layers activated:', Array.from(defaultLayers))
        setActiveLayers(defaultLayers)
      }
      
      setLoading(false)
    } catch (err) {
      console.error('Error fetching layers:', err)
      setError(err.message)
      setLoading(false)
    }
  }

  const toggleLayer = (layerId) => {
    setActiveLayers(prev => {
      const newSet = new Set(prev)
      if (newSet.has(layerId)) {
        console.log(`Deactivating layer: ${layerId}`)
        newSet.delete(layerId)
      } else {
        console.log(`Activating layer: ${layerId}`)
        newSet.add(layerId)
      }
      console.log(`Active layers after toggle:`, Array.from(newSet))
      return newSet
    })
  }

  const clearAllLayers = () => {
    setActiveLayers(new Set())
  }

  const clearFeaturedLayers = () => {
    // Only clear the featured layers based on region
    // Exclude protected-forest for GB, AJK, Balochistan, and Sindh regions (they have 0 features)
    // Exclude ramsar-sites for GB and AJK regions (they have 0 features)
    // For Sindh, use Sindh-specific layers instead of national ones
    // For KP, exclude protected-areas and ramsar-sites
    let featuredLayerIds = ['protected-areas', 'protected-forest', 'ramsar-sites', 'kbas']
    if (selectedRegion === 'Gilgit Baltistan' || selectedRegion === 'AJK') {
      featuredLayerIds = ['protected-areas', 'kbas'] // Remove protected-forest and ramsar-sites for GB and AJK
    } else if (selectedRegion === 'Balochistan') {
      featuredLayerIds = ['protected-areas', 'ramsar-sites', 'kbas'] // Remove protected-forest for Balochistan
    } else if (selectedRegion === 'Sindh') {
      featuredLayerIds = ['protected-areas-sindh', 'ramsar-sites-sindh', 'kbas'] // Use Sindh-specific layers
    } else if (selectedRegion === 'KP') {
      featuredLayerIds = ['protected-forest', 'kbas'] // Remove protected-areas and ramsar-sites for KP
    }
    setActiveLayers(prev => {
      const newSet = new Set(prev)
      featuredLayerIds.forEach(layerId => {
        newSet.delete(layerId)
      })
      return newSet
    })
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Dashboard</h2>
          <p className="text-gray-600">{error}</p>
          <p className="text-sm text-gray-500 mt-2">Make sure the backend server is running on port 3001</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full max-w-full flex flex-col bg-gray-50 overflow-x-hidden">
      {/* Region Toggle Buttons */}
      <div className="bg-white border-b border-gray-200 px-2 sm:px-3 py-2 flex items-center justify-center">
        <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-0.5 overflow-x-auto max-w-full scrollbar-hide">
          {regions.map((region) => (
            <button
              key={region}
              onClick={() => setSelectedRegion(region)}
              className={`px-2 sm:px-3 py-1.5 rounded-md font-medium text-[10px] sm:text-xs transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
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
      
      {/* Statistics Cards - Show for Gilgit Baltistan, Punjab, Sindh, and Balochistan */}
      {(selectedRegion === 'Gilgit Baltistan' || selectedRegion === 'Punjab' || selectedRegion === 'Sindh' || selectedRegion === 'Balochistan') && (
      <StatisticsCards layerData={layerData} activeLayers={activeLayers} selectedRegion={getBackendRegionName(selectedRegion)} />
      )}
      <FeaturedLayers 
        layers={layers}
        activeLayers={activeLayers}
        onToggleLayer={toggleLayer}
        onClearAll={clearFeaturedLayers}
        selectedRegion={getBackendRegionName(selectedRegion)}
        isLayerPanelOpen={isLayerPanelOpen}
        setIsLayerPanelOpen={setIsLayerPanelOpen}
      />
      <div className="flex flex-col lg:flex-row flex-1" style={{ minHeight: isMobile ? 'auto' : 'calc(100vh - 280px)' }}>
        <LayerPanel 
          layers={layers}
          activeLayers={activeLayers}
          onToggleLayer={toggleLayer}
          onClearAll={clearAllLayers}
          showMobileButton={false}
          isOpen={isLayerPanelOpen}
          setIsOpen={setIsLayerPanelOpen}
          selectedRegion={getBackendRegionName(selectedRegion)}
        />
        <div 
          className="flex-1 relative min-w-0 transition-all duration-300" 
          style={{ 
          height: isMobile ? 'calc(100vh - 280px)' : 'calc(100vh - 50px)',
          minHeight: '400px',
          maxHeight: isMobile ? 'calc(100vh - 280px)' : 'none'
          }}
        >
          {/* Mobile toggle button - Fixed to map container, above bottom sheet */}
          {isMobile && (
            <button
              onClick={() => setIsLayerPanelOpen(!isLayerPanelOpen)}
              className="lg:hidden absolute bottom-5 right-5 z-[1200] bg-green-600 text-white p-3 rounded-full shadow-2xl hover:bg-green-700 transition-all transform hover:scale-110 active:scale-95"
              aria-label="Toggle layers panel"
              style={{ 
                boxShadow: '0 8px 20px rgba(34, 197, 94, 0.4)',
                pointerEvents: 'auto'
              }}
            >
              {isLayerPanelOpen ? <FaTimes className="text-white text-lg" /> : <FaBars className="text-white text-lg" />}
            </button>
          )}
          <MapView 
            layers={layers}
            activeLayers={activeLayers}
            selectedRegion={getBackendRegionName(selectedRegion)}
            panelOpen={isLayerPanelOpen}
            onLayerDataChange={handleLayerDataChange}
            onFeatureSelect={handleFeatureSelect}
          />
        </div>
      </div>
      
      {/* Layer Data Dashboard - Show below map for all provinces */}
      {(selectedRegion === 'Gilgit Baltistan' || selectedRegion === 'Punjab' || selectedRegion === 'Sindh' || selectedRegion === 'Balochistan' || selectedRegion === 'KP' || selectedRegion === 'AJK') && (
        <div className="mt-4 sm:mt-6">
          <LayerDataDashboard 
            layerData={layerData}
            activeLayers={activeLayers}
            layers={layers}
            selectedRegion={getBackendRegionName(selectedRegion)}
            selectedFeature={selectedFeature}
          />
        </div>
      )}
      
      {/* Partners Section with spacing */}
      <div className={isMobile ? "mt-2" : "mt-4 sm:mt-6"}>
        <PartnersSection />
      </div>
      
      <ScrollToFooter />
    </div>
  )
}

export default Dashboard

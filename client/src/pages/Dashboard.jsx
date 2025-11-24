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
  const [selectedRegion, setSelectedRegion] = useState('Gilgit Baltistan') // Default to Gilgit Baltistan to show stats
  
  // Define all regions - only Gilgit Baltistan shows stats
  const regions = ['National', 'Gilgit Baltistan', 'Punjab', 'AJK', 'Balochistan', 'Sindh', 'Khyber Pakhtunkhwa']

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

  // Automatically toggle region boundary layer based on region selection
  useEffect(() => {
    if (layers.length === 0) return // Wait for layers to load
    
    setActiveLayers(prev => {
      const newSet = new Set(prev)
      
      if (selectedRegion === 'Gilgit Baltistan') {
        // Add gb-district layer when Gilgit Baltistan is selected
        if (!newSet.has('gb-district')) {
          console.log('Auto-activating gb-district layer for Gilgit Baltistan')
          newSet.add('gb-district')
        }
        // Remove Punjab boundary if it was active
        if (newSet.has('punjab-provincial')) {
          newSet.delete('punjab-provincial')
        }
        // Keep pakistan-provinces active for overlay
        if (!newSet.has('pakistan-provinces')) {
          newSet.add('pakistan-provinces')
        }
      } else if (selectedRegion === 'Punjab') {
        // Add punjab-provincial layer when Punjab is selected
        if (!newSet.has('punjab-provincial')) {
          console.log('Auto-activating punjab-provincial layer for Punjab')
          newSet.add('punjab-provincial')
        }
        // Remove GB boundary layers if they were active
        if (newSet.has('gb-district')) {
          newSet.delete('gb-district')
        }
        if (newSet.has('gb-provincial')) {
          newSet.delete('gb-provincial')
        }
        // Keep pakistan-provinces active for overlay
        if (!newSet.has('pakistan-provinces')) {
          newSet.add('pakistan-provinces')
        }
      } else {
        // Remove all region-specific boundary layers when other regions are selected
        if (newSet.has('gb-district')) {
          console.log('Auto-deactivating gb-district layer')
          newSet.delete('gb-district')
        }
        if (newSet.has('gb-provincial')) {
          newSet.delete('gb-provincial')
        }
        if (newSet.has('punjab-provincial')) {
          newSet.delete('punjab-provincial')
        }
      }
      
      return newSet
    })
  }, [selectedRegion, layers])

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
        newSet.delete(layerId)
      } else {
        newSet.add(layerId)
      }
      return newSet
    })
  }

  const clearAllLayers = () => {
    setActiveLayers(new Set())
  }

  const clearFeaturedLayers = () => {
    // Only clear the featured layers based on region
    // Exclude protected-forest and ramsar-sites for GB region (they have 0 features)
    let featuredLayerIds = ['protected-areas', 'protected-forest', 'ramsar-sites', 'kbas']
    if (selectedRegion === 'Gilgit Baltistan') {
      featuredLayerIds = ['protected-areas', 'kbas'] // Remove protected-forest and ramsar-sites for GB
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
      <div className="bg-white border-b border-gray-200 px-2 sm:px-4 py-3 flex items-center justify-center">
        <div className="flex items-center space-x-1 sm:space-x-2 bg-gray-100 rounded-lg p-1 overflow-x-auto max-w-full scrollbar-hide">
          {regions.map((region) => (
            <button
              key={region}
              onClick={() => setSelectedRegion(region)}
              className={`px-3 sm:px-4 py-2 rounded-md font-medium text-xs sm:text-sm transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
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
      
      {/* Statistics Cards - Show for Gilgit Baltistan and Punjab */}
      {(selectedRegion === 'Gilgit Baltistan' || selectedRegion === 'Punjab') && (
      <StatisticsCards layerData={layerData} activeLayers={activeLayers} selectedRegion={selectedRegion} />
      )}
      <FeaturedLayers 
        layers={layers}
        activeLayers={activeLayers}
        onToggleLayer={toggleLayer}
        onClearAll={clearFeaturedLayers}
        selectedRegion={selectedRegion}
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
          selectedRegion={selectedRegion}
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
              className="lg:hidden absolute bottom-6 right-6 z-[1200] bg-green-600 text-white p-4 rounded-full shadow-2xl hover:bg-green-700 transition-all transform hover:scale-110 active:scale-95"
              aria-label="Toggle layers panel"
              style={{ 
                boxShadow: '0 10px 25px rgba(34, 197, 94, 0.4)',
                pointerEvents: 'auto'
              }}
            >
              {isLayerPanelOpen ? <FaTimes className="text-white text-xl" /> : <FaBars className="text-white text-xl" />}
            </button>
          )}
          <MapView 
            layers={layers}
            activeLayers={activeLayers}
            selectedRegion={selectedRegion}
            panelOpen={isLayerPanelOpen}
            onLayerDataChange={handleLayerDataChange}
            onFeatureSelect={handleFeatureSelect}
          />
        </div>
      </div>
      
      {/* Layer Data Dashboard - Show below map for Gilgit Baltistan and Punjab */}
      {(selectedRegion === 'Gilgit Baltistan' || selectedRegion === 'Punjab') && (
        <div className="mt-4 sm:mt-6">
          <LayerDataDashboard 
            layerData={layerData}
            activeLayers={activeLayers}
            layers={layers}
            selectedRegion={selectedRegion}
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

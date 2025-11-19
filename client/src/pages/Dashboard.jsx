import { useState, useEffect } from 'react'
import { FaBars, FaTimes } from 'react-icons/fa'
import MapView from '../components/MapView'
import LayerPanel from '../components/LayerPanel'
import LoadingSpinner from '../components/LoadingSpinner'
import StatisticsCards from '../components/StatisticsCards'
import FeaturedLayers from '../components/FeaturedLayers'
import PartnersSection from '../components/PartnersSection'
import ScrollToFooter from '../components/ScrollToFooter'

function Dashboard() {
  const [layers, setLayers] = useState([])
  const [activeLayers, setActiveLayers] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [layerData, setLayerData] = useState({})
  const [isMobile, setIsMobile] = useState(false)
  const [isLayerPanelOpen, setIsLayerPanelOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024
    }
    return true
  })
  const [selectedRegion, setSelectedRegion] = useState('Gilgit Baltistan') // Default to Gilgit Baltistan to show stats

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

  const fetchLayers = async () => {
    try {
      console.log('Fetching layers from http://localhost:3001/api/layers')
      const response = await fetch('http://localhost:3001/api/layers')
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
    // Only clear the 4 featured layers: protected-areas, protected-forest, ramsar-sites, kbas
    const featuredLayerIds = ['protected-areas', 'protected-forest', 'ramsar-sites', 'kbas']
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
      {/* Region Toggle Button */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-center">
        <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setSelectedRegion('National')}
            className={`px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 ${
              selectedRegion === 'National'
                ? 'bg-white text-green-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            National
          </button>
          <button
            onClick={() => setSelectedRegion('Gilgit Baltistan')}
            className={`px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 ${
              selectedRegion === 'Gilgit Baltistan'
                ? 'bg-white text-green-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Gilgit Baltistan
          </button>
        </div>
      </div>
      
      {/* Statistics Cards - Only show when Gilgit Baltistan is selected */}
      {selectedRegion === 'Gilgit Baltistan' && (
        <StatisticsCards layerData={layerData} activeLayers={activeLayers} />
      )}
      <FeaturedLayers 
        layers={layers}
        activeLayers={activeLayers}
        onToggleLayer={toggleLayer}
        onClearAll={clearFeaturedLayers}
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
        />
        <div className="flex-1 relative min-w-0 w-full" style={{ 
          height: isMobile ? 'calc(100vh - 280px)' : 'calc(100vh - 50px)',
          minHeight: '400px',
          maxHeight: isMobile ? 'calc(100vh - 280px)' : 'none'
        }}>
          {/* Mobile toggle button - Fixed to map container */}
          {isMobile && (
            <button
              onClick={() => setIsLayerPanelOpen(!isLayerPanelOpen)}
              className="lg:hidden absolute bottom-6 right-6 z-50 bg-green-600 text-white p-4 rounded-full shadow-2xl hover:bg-green-700 transition-all transform hover:scale-110 active:scale-95"
              aria-label="Toggle layers panel"
              style={{ 
                boxShadow: '0 10px 25px rgba(34, 197, 94, 0.4)'
              }}
            >
              {isLayerPanelOpen ? <FaTimes className="text-white text-xl" /> : <FaBars className="text-white text-xl" />}
            </button>
          )}
          <MapView 
            layers={layers}
            activeLayers={activeLayers}
          />
        </div>
      </div>
      
      {/* Partners Section with spacing */}
      <div className={isMobile ? "mt-2" : "mt-4 sm:mt-6"}>
        <PartnersSection />
      </div>
      
      <ScrollToFooter />
    </div>
  )
}

export default Dashboard

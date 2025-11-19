import { useState, useEffect } from 'react'
import MapView from '../components/MapView'
import LayerPanel from '../components/LayerPanel'
import LoadingSpinner from '../components/LoadingSpinner'
import StatisticsCards from '../components/StatisticsCards'
import FeaturedLayers from '../components/FeaturedLayers'
import ScrollToFooter from '../components/ScrollToFooter'

function Dashboard() {
  const [layers, setLayers] = useState([])
  const [activeLayers, setActiveLayers] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [layerData, setLayerData] = useState({})

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
      <StatisticsCards layerData={layerData} activeLayers={activeLayers} />
      <FeaturedLayers 
        layers={layers}
        activeLayers={activeLayers}
        onToggleLayer={toggleLayer}
        onClearAll={clearFeaturedLayers}
      />
      <div className="flex flex-col lg:flex-row flex-1" style={{ minHeight: 'calc(100vh - 280px)' }}>
        <LayerPanel 
          layers={layers}
          activeLayers={activeLayers}
          onToggleLayer={toggleLayer}
          onClearAll={clearAllLayers}
        />
        <div className="flex-1 relative min-w-0 w-full" style={{ height: 'calc(100vh - 280px)' }}>
          <MapView 
            layers={layers}
            activeLayers={activeLayers}
          />
        </div>
      </div>
      <ScrollToFooter />
    </div>
  )
}

export default Dashboard

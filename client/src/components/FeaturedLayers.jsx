import { useState, useEffect } from 'react'
import { FaShieldAlt, FaTree, FaWater, FaMapMarkedAlt, FaTimes, FaChevronDown, FaChevronUp, FaChevronRight } from 'react-icons/fa'

export default function FeaturedLayers({ layers, activeLayers, onToggleLayer, onClearAll, selectedRegion = 'National', isLayerPanelOpen, setIsLayerPanelOpen }) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isDesktop, setIsDesktop] = useState(false)
  
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024)
    }
    checkDesktop()
    window.addEventListener('resize', checkDesktop)
    return () => window.removeEventListener('resize', checkDesktop)
  }, [])
  
  // Featured layers - most important ones
  // Exclude protected-forest for GB, AJK, Balochistan, and Sindh regions (they have 0 features)
  // Exclude ramsar-sites for GB and AJK regions (they have 0 features)
  // For Sindh, use Sindh-specific layers instead of national ones
  // For Khyber Pakhtunkhwa, exclude protected-areas, ramsar-sites, and protected-forest
  let featuredLayerIds = ['protected-areas', 'protected-forest', 'ramsar-sites', 'kbas']
  if (selectedRegion === 'Gilgit Baltistan' || selectedRegion === 'Azad Kashmir' || selectedRegion === 'AJK') {
    featuredLayerIds = ['kbas'] // Remove protected-areas, protected-forest and ramsar-sites for GB and AJK
  } else if (selectedRegion === 'Punjab') {
    featuredLayerIds = ['protected-forest', 'ramsar-sites', 'kbas'] // Remove protected-areas for Punjab
  } else if (selectedRegion === 'Balochistan') {
    featuredLayerIds = ['protected-areas', 'ramsar-sites', 'kbas'] // Remove protected-forest for Balochistan
  } else if (selectedRegion === 'Sindh') {
    featuredLayerIds = ['ramsar-sites-sindh', 'kbas'] // Remove protected-areas-sindh from Quick Access
  } else if (selectedRegion === 'Khyber Pakhtunkhwa') {
    featuredLayerIds = ['kbas'] // Remove protected-areas, ramsar-sites, and protected-forest for Khyber Pakhtunkhwa
  }
  const featuredLayers = layers.filter(layer => featuredLayerIds.includes(layer.id))
  
  // Check if any of the featured layers are active
  const hasActiveFeaturedLayers = featuredLayers.some(layer => activeLayers.has(layer.id))

  const getFeaturedIcon = (layerId) => {
    const icons = {
      'protected-areas': FaShieldAlt,
      'protected-areas-pol': FaShieldAlt,
      'protected-areas-sindh': FaShieldAlt,
      'protected-forest': FaTree,
      'ramsar-sites': FaWater,
      'ramsar-sites-sindh': FaWater,
      'kbas': FaMapMarkedAlt,
    }
    return icons[layerId] || FaMapMarkedAlt
  }

  if (featuredLayers.length === 0) return null

  return (
    <div className="bg-gradient-to-r from-green-50 via-blue-50 to-green-50 border-b border-gray-200 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 shadow-sm relative">
      {/* Data Layers Panel Expand Button - Fixed on left side when panel is collapsed (desktop only) */}
      {isDesktop && !isLayerPanelOpen && setIsLayerPanelOpen && (
        <button
          onClick={() => setIsLayerPanelOpen(true)}
          className="hidden lg:flex absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-green-600 text-white p-2 rounded-r-lg shadow-lg hover:bg-green-700 transition-all duration-300 items-center justify-center"
          style={{ 
            height: '48px',
            borderTopRightRadius: '6px',
            borderBottomRightRadius: '6px'
          }}
          title="Expand Data Layers Panel"
        >
          <FaChevronRight className="text-base" />
        </button>
      )}
      <div className={`max-w-7xl mx-auto ${isDesktop && !isLayerPanelOpen && setIsLayerPanelOpen ? 'lg:pl-14' : ''}`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-1.5 sm:mb-2 gap-1.5">
          <div className="flex items-center space-x-1.5 flex-1 justify-center">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 text-gray-600 hover:text-green-600 hover:bg-green-100 rounded-lg transition-all"
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? (
                <FaChevronUp className="text-xs sm:text-sm" />
              ) : (
                <FaChevronDown className="text-xs sm:text-sm" />
              )}
            </button>
            <h3 className="text-[10px] sm:text-xs font-semibold text-gray-700 uppercase tracking-wider text-center">Quick Access - Featured Layers</h3>
          </div>
          <div className="flex items-center space-x-1.5">
            {hasActiveFeaturedLayers && (
              <button
                onClick={onClearAll}
                className="flex items-center space-x-1 px-2 sm:px-2.5 py-1 text-[10px] sm:text-xs font-medium text-red-600 bg-red-50 border border-red-300 rounded-lg hover:bg-red-100 hover:border-red-400 transition-all"
                title="Clear all featured layers"
              >
                <FaTimes className="text-[10px] sm:text-xs" />
                <span>Clear All</span>
              </button>
            )}
          </div>
        </div>
        <div 
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center items-center">
            {featuredLayers.map((layer) => {
              const IconComponent = getFeaturedIcon(layer.id)
              const isActive = activeLayers.has(layer.id)
              return (
                <button
                  key={layer.id}
                  onClick={() => onToggleLayer(layer.id)}
                  className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-lg text-[10px] sm:text-xs font-semibold transition-all transform hover:scale-105 ${
                    isActive
                      ? 'bg-green-600 text-white shadow-lg hover:bg-green-700 hover:shadow-xl'
                      : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-green-500 hover:bg-green-50 hover:text-green-700'
                  }`}
                >
                  <IconComponent className={isActive ? 'text-white text-xs sm:text-sm' : 'text-green-600 text-xs sm:text-sm'} />
                  <span className="hidden sm:inline">{layer.name}</span>
                  <span className="sm:hidden">{layer.name.split(' ')[0]}</span>
                  {isActive && (
                    <span className="ml-0.5 text-[10px] sm:text-xs font-bold">✓</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}


import { useState } from 'react'
import { FaShieldAlt, FaTree, FaWater, FaMapMarkedAlt, FaTimes, FaChevronDown, FaChevronUp } from 'react-icons/fa'

export default function FeaturedLayers({ layers, activeLayers, onToggleLayer, onClearAll }) {
  const [isExpanded, setIsExpanded] = useState(true)
  
  // Featured layers - most important ones
  const featuredLayerIds = ['protected-areas', 'protected-forest', 'ramsar-sites', 'kbas']
  const featuredLayers = layers.filter(layer => featuredLayerIds.includes(layer.id))
  
  // Check if any of the featured layers are active
  const hasActiveFeaturedLayers = featuredLayers.some(layer => activeLayers.has(layer.id))

  const getFeaturedIcon = (layerId) => {
    const icons = {
      'protected-areas': FaShieldAlt,
      'protected-areas-pol': FaShieldAlt,
      'protected-forest': FaTree,
      'ramsar-sites': FaWater,
      'kbas': FaMapMarkedAlt,
    }
    return icons[layerId] || FaMapMarkedAlt
  }

  if (featuredLayers.length === 0) return null

  return (
    <div className="bg-gradient-to-r from-green-50 via-blue-50 to-green-50 border-b border-gray-200 px-3 sm:px-4 md:px-6 py-2 sm:py-3 shadow-sm">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 sm:mb-3 gap-2">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 text-gray-600 hover:text-green-600 hover:bg-green-100 rounded-lg transition-all"
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? (
                <FaChevronUp className="text-sm sm:text-base" />
              ) : (
                <FaChevronDown className="text-sm sm:text-base" />
              )}
            </button>
            <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Quick Access - Featured Layers</h3>
          </div>
          <div className="flex items-center space-x-2">
            {hasActiveFeaturedLayers && (
              <button
                onClick={onClearAll}
                className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-300 rounded-lg hover:bg-red-100 hover:border-red-400 transition-all"
                title="Clear all featured layers"
              >
                <FaTimes className="text-xs" />
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
          <div className="flex flex-wrap gap-2 sm:gap-2.5 justify-center items-center">
            {featuredLayers.map((layer) => {
              const IconComponent = getFeaturedIcon(layer.id)
              const isActive = activeLayers.has(layer.id)
              return (
                <button
                  key={layer.id}
                  onClick={() => onToggleLayer(layer.id)}
                  className={`flex items-center space-x-1.5 sm:space-x-2.5 px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all transform hover:scale-105 ${
                    isActive
                      ? 'bg-green-600 text-white shadow-lg hover:bg-green-700 hover:shadow-xl'
                      : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-green-500 hover:bg-green-50 hover:text-green-700'
                  }`}
                >
                  <IconComponent className={isActive ? 'text-white text-sm sm:text-base' : 'text-green-600 text-sm sm:text-base'} />
                  <span className="hidden sm:inline">{layer.name}</span>
                  <span className="sm:hidden">{layer.name.split(' ')[0]}</span>
                  {isActive && (
                    <span className="ml-0.5 sm:ml-1 text-xs font-bold">✓</span>
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


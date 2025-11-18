import { FaShieldAlt, FaTree, FaWater, FaMapMarkedAlt, FaTimes } from 'react-icons/fa'

export default function FeaturedLayers({ layers, activeLayers, onToggleLayer, onClearAll }) {
  // Featured layers - most important ones
  const featuredLayerIds = ['protected-areas', 'protected-forest', 'ramsar-sites', 'kbas']
  const featuredLayers = layers.filter(layer => featuredLayerIds.includes(layer.id))

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
          <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Quick Access - Featured Layers</h3>
          {activeLayers.size > 0 && (
            <button
              onClick={onClearAll}
              className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-300 rounded-lg hover:bg-red-100 hover:border-red-400 transition-all"
            >
              <FaTimes className="text-xs" />
              <span>Clear All</span>
            </button>
          )}
        </div>
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
  )
}


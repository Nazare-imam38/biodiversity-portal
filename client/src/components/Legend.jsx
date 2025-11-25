import { useState } from 'react'
import { 
  FaLeaf, 
  FaTree, 
  FaMountain, 
  FaSun, 
  FaShieldAlt, 
  FaSeedling, 
  FaLink, 
  FaWater,
  FaMapMarkedAlt,
  FaMapMarkerAlt,
  FaGlobe,
  FaChevronDown,
  FaChevronUp
} from 'react-icons/fa'

const layerIcons = {
  'pakistan-provinces': FaMapMarkerAlt,
  'agroecological-zones': FaLeaf,
  'ecoregions': FaSeedling,
  'kbas': FaMapMarkedAlt,
  'protected-areas': FaShieldAlt,
  'protected-areas-pol': FaShieldAlt,
  'protected-forest': FaTree,
  'ramsar-sites': FaWater,
  'gb-provincial': FaGlobe,
  'gb-district': FaMapMarkedAlt,
  'wildlife-occurrence': FaMapMarkerAlt,
  'punjab-lulc': FaMapMarkedAlt,
  'pakistan-lulc': FaMapMarkedAlt,
}

export default function Legend({ layers, activeLayers }) {
  const [isExpanded, setIsExpanded] = useState(true)
  
  // Filter out base reference layers (like provinces) from legend
  const activeLayersList = layers.filter(layer => 
    activeLayers.has(layer.id) && layer.id !== 'pakistan-provinces'
  )

  if (activeLayersList.length === 0) {
    return null
  }

  return (
    <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 bg-white rounded-lg shadow-lg border border-gray-200 z-[1100] min-w-[180px] sm:min-w-[220px] max-w-[240px] sm:max-w-[280px]" style={{ pointerEvents: 'auto' }}>
      <div className="flex items-center justify-between p-2 sm:p-3 border-b border-gray-200">
        <h3 className="font-semibold text-gray-800 text-xs sm:text-sm">Legend</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 text-gray-600 hover:text-green-600 hover:bg-green-100 rounded-lg transition-all"
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
          title={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? (
            <FaChevronDown className="text-xs sm:text-sm" />
          ) : (
            <FaChevronUp className="text-xs sm:text-sm" />
          )}
        </button>
      </div>
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? 'opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-2 sm:p-3 space-y-2 sm:space-y-2.5">
          {activeLayersList.map((layer) => {
            const IconComponent = layerIcons[layer.id] || FaLeaf
            
            // Special handling for Pakistan LULC layer - show custom legend
            if (layer.id === 'pakistan-lulc') {
              const pakistanLULCLegend = [
                { color: '#FFA500', label: 'Cropland' }, // Orange
                { color: '#22c55e', label: 'Vegetation' }, // Green
                { color: '#06b6d4', label: 'Built Up Area' }, // Cyan (based on image)
                { color: '#3b82f6', label: 'Waterbodies' } // Blue
              ]
              
              return (
                <div key={layer.id} className="space-y-2">
                  <div className="flex items-center space-x-2 sm:space-x-3 text-xs sm:text-sm mb-2">
                    <div className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0">
                      <div 
                        className="p-1 sm:p-1.5 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${layer.color}20` }}
                      >
                        <IconComponent 
                          className="text-xs sm:text-sm" 
                          style={{ color: layer.color }}
                        />
                      </div>
                    </div>
                    <span className="text-gray-700 text-xs leading-tight font-medium">{layer.name}</span>
                  </div>
                  <div className="pl-7 sm:pl-9 space-y-1.5">
                    {pakistanLULCLegend.map((item, idx) => (
                      <div key={idx} className="flex items-center space-x-2 sm:space-x-3 text-xs">
                        <div 
                          className="w-4 h-4 sm:w-5 sm:h-5 rounded flex-shrink-0 border border-gray-300"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-gray-700 text-xs leading-tight">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            }
            
            // Special handling for Punjab LULC layer - show custom legend
            if (layer.id === 'punjab-lulc') {
              const punjabLULCLegend = [
                { color: '#FF00FF', label: 'Dense Vegetation' }, // Magenta
                { color: '#00FFFF', label: 'Agricultural Land' }, // Cyan
                { color: '#4169E1', label: 'Sparse Vegetation' }, // Royal Blue
                { color: '#FF0000', label: 'Water' }, // Red
                { color: '#00FF00', label: 'Built Up Area' }, // Bright Green
                { color: '#FFFFE0', label: 'Barren Land' } // Light Yellow
              ]
              
              return (
                <div key={layer.id} className="space-y-2">
                  <div className="flex items-center space-x-2 sm:space-x-3 text-xs sm:text-sm mb-2">
                    <div className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0">
                      <div 
                        className="p-1 sm:p-1.5 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${layer.color}20` }}
                      >
                        <IconComponent 
                          className="text-xs sm:text-sm" 
                          style={{ color: layer.color }}
                        />
                      </div>
                    </div>
                    <span className="text-gray-700 text-xs leading-tight font-medium">{layer.name}</span>
                  </div>
                  <div className="pl-7 sm:pl-9 space-y-1.5">
                    {punjabLULCLegend.map((item, idx) => (
                      <div key={idx} className="flex items-center space-x-2 sm:space-x-3 text-xs">
                        <div 
                          className="w-4 h-4 sm:w-5 sm:h-5 rounded flex-shrink-0 border border-gray-300"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-gray-700 text-xs leading-tight">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            }
            
            // Default legend display for other layers
            return (
              <div key={layer.id} className="flex items-center space-x-2 sm:space-x-3 text-xs sm:text-sm">
                <div className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0">
                  <div 
                    className="p-1 sm:p-1.5 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${layer.color}20` }}
                  >
                    <IconComponent 
                      className="text-xs sm:text-sm" 
                      style={{ color: layer.color }}
                    />
                  </div>
                </div>
                <span className="text-gray-700 text-xs leading-tight truncate">{layer.name}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}


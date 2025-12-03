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
  FaChevronUp,
  FaExclamationTriangle
} from 'react-icons/fa'

const layerIcons = {
  'pakistan-provinces': FaMapMarkerAlt,
  'agroecological-zones': FaLeaf,
  'ecoregions': FaSeedling,
  'kbas': FaMapMarkedAlt,
  'protected-areas': FaShieldAlt,
  'protected-areas-pol': FaShieldAlt,
  'protected-areas-kp': FaShieldAlt,
  'protected-forest': FaTree,
  'ramsar-sites': FaWater,
  'gb-provincial': FaGlobe,
  'gb-district': FaMapMarkedAlt,
  'kp-provincial': FaGlobe,
  'wildlife-occurrence': FaMapMarkerAlt,
  'punjab-lulc': FaMapMarkedAlt,
  'pakistan-lulc': FaMapMarkedAlt,
  'sindh-lulc': FaMapMarkedAlt,
  'balochistan-lulc': FaMapMarkedAlt,
  'ajk-lulc': FaMapMarkedAlt,
  'kp-forest': FaTree,
  'ajk-forest-mask': FaTree,
  'ajk-deforestation': FaExclamationTriangle,
  'forest-types': FaTree,
}

export default function Legend({ layers, activeLayers, selectedRegion }) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isForestLegendExpanded, setIsForestLegendExpanded] = useState(true)
  
  // Filter out base reference layers (like provinces) and forest-types from main legend
  // Also filter out balochistan-lulc and agroecological-zones when AJK is selected
  // Show AJK LULC, AJK Forest Mask, and AJK Deforestation only for AJK region
  const activeLayersList = layers.filter(layer => {
    if (!activeLayers.has(layer.id)) return false
    if (layer.id === 'pakistan-provinces' || layer.id === 'forest-types') return false
    if ((selectedRegion === 'Azad Kashmir' || selectedRegion === 'AJK') && (layer.id === 'balochistan-lulc' || layer.id === 'agroecological-zones')) return false
    // Hide AJK LULC, AJK Forest Mask, and AJK Deforestation for non-AJK regions
    if (selectedRegion !== 'Azad Kashmir' && selectedRegion !== 'AJK' && (layer.id === 'ajk-lulc' || layer.id === 'ajk-forest-mask' || layer.id === 'ajk-deforestation')) return false
    return true
  })
  
  // Separate check for forest-types layer
  const forestTypesLayer = layers.find(layer => layer.id === 'forest-types' && activeLayers.has(layer.id))

  // Render both legends if needed
  return (
    <>
      {/* Main Legend (Left Side) - Excludes Forest Stratification */}
      {activeLayersList.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg border border-gray-200 z-[1100] min-w-[180px] sm:min-w-[220px] max-w-[240px] sm:max-w-[280px]" style={{ pointerEvents: 'auto' }}>
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
                { color: '#3b82f6', label: 'Waterbodies' }, // Blue
                { color: '#fbfbc9', label: 'Barren Land' } // Light yellow/beige
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
            
            // Special handling for Sindh LULC layer - show custom legend
            if (layer.id === 'sindh-lulc') {
              const sindhLULCLegend = [
                { color: '#22c55e', label: 'Alluvial Soil' }, // Green
                { color: '#FF00FF', label: 'Agricultural Land' }, // Magenta
                { color: '#9370DB', label: 'Dense Vegetation' }, // Purple/Lavender
                { color: '#06b6d4', label: 'Water Bodies' }, // Cyan
                { color: '#f9f913', label: 'Built Up Area' }, // Yellow
                { color: '#ff4500', label: 'Barren Land' } // Orange/Red-Orange
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
                    {sindhLULCLegend.map((item, idx) => (
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
            
            // Special handling for Balochistan LULC layer - show custom legend
            if (layer.id === 'balochistan-lulc') {
              const balochistanLULCLegend = [
                { color: '#8855cb', label: 'Bare Land' }, // Purple
                { color: '#75d29d', label: 'Vegetation' }, // Light green
                { color: '#d08f5b', label: 'Barren Land' }, // Light brown/tan
                { color: '#298ad5', label: 'Water Bodies' }, // Blue
                { color: '#86c92e', label: 'Built Up Area' }, // Lime green
                { color: '#dd7c9b', label: 'Rangeland' } // Pink
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
                    {balochistanLULCLegend.map((item, idx) => (
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
            
            // Special handling for KP LULC layer - show custom legend
            if (layer.id === 'kp-lulc') {
              const kpLULCLegend = [
                { color: '#00FF00', label: 'Rangeland' }, // Bright green
                { color: '#FF00FF', label: 'Agricultural Land' }, // Magenta
                { color: '#08aab4', label: 'Barren Land' }, // Cyan/Teal
                { color: '#0707d8', label: 'Water Bodies' }, // Blue
                { color: '#bced12', label: 'Built Up Area' }, // Lime green/Yellow-green
                { color: '#A0522D', label: 'Bare Land' } // Brownish-red
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
                    {kpLULCLegend.map((item, idx) => (
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
      )}
      
      {/* Forest Stratification Legend (Right Side) - Separate Legend */}
      {forestTypesLayer && (
        <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 z-[1100] min-w-[180px] sm:min-w-[220px] max-w-[240px] sm:max-w-[280px]" style={{ pointerEvents: 'auto' }}>
          <div className="flex items-center justify-between p-2 sm:p-3 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800 text-xs sm:text-sm">Forest Stratification</h3>
            <button
              onClick={() => setIsForestLegendExpanded(!isForestLegendExpanded)}
              className="p-1 text-gray-600 hover:text-green-600 hover:bg-green-100 rounded-lg transition-all"
              aria-label={isForestLegendExpanded ? 'Collapse' : 'Expand'}
              title={isForestLegendExpanded ? 'Collapse' : 'Expand'}
            >
              {isForestLegendExpanded ? (
                <FaChevronDown className="text-xs sm:text-sm" />
              ) : (
                <FaChevronUp className="text-xs sm:text-sm" />
              )}
            </button>
          </div>
          <div 
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              isForestLegendExpanded ? 'opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="p-2 sm:p-3 space-y-2 sm:space-y-2.5">
              <div className="space-y-2">
                <div className="flex items-center space-x-2 sm:space-x-3 text-xs sm:text-sm mb-2">
                  <div className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0">
                    <div 
                      className="p-1 sm:p-1.5 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${forestTypesLayer.color}20` }}
                    >
                      <FaTree 
                        className="text-xs sm:text-sm" 
                        style={{ color: forestTypesLayer.color }}
                      />
                    </div>
                  </div>
                  <span className="text-gray-700 text-xs leading-tight font-medium">{forestTypesLayer.name}</span>
                </div>
                <div className="pl-7 sm:pl-9 space-y-1.5">
                  {[
                    { color: '#87CEEB', label: 'Riverine' }, // Light blue
                    { color: '#F5DEB3', label: 'Thorn' }, // Light beige
                    { color: '#9CAF88', label: 'Scrub' }, // Light olive green
                    { color: '#20B2AA', label: 'Moist-Temperate' }, // Teal-green
                    { color: '#6B8E23', label: 'Dry-Temperate' }, // Darker olive green
                    { color: '#5F9EA0', label: 'Sub-Alpine' }, // Muted blue-green
                    { color: '#32CD32', label: 'ChirPine' }, // Bright lime green
                    { color: '#92b3a2', label: 'Mangrove' }, // Updated color
                    { color: '#8FBC8F', label: 'Irrigated Plantation' }, // Muted green-grey
                    { color: '#FFA500', label: 'Chilghoza' } // Orange
                  ].map((item, idx) => (
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
            </div>
          </div>
        </div>
      )}
    </>
  )
}


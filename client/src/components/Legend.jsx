import { FaMapMarkerAlt } from 'react-icons/fa'

export default function Legend({ layers, activeLayers }) {
  // Filter out base reference layers (like provinces) from legend
  const activeLayersList = layers.filter(layer => 
    activeLayers.has(layer.id) && layer.id !== 'pakistan-provinces'
  )

  if (activeLayersList.length === 0) {
    return null
  }

  return (
    <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 bg-white rounded-lg shadow-lg border border-gray-200 z-[1000] p-2 sm:p-3 md:p-4 min-w-[180px] sm:min-w-[220px] max-w-[240px] sm:max-w-[280px]">
      <h3 className="font-semibold text-gray-800 mb-2 sm:mb-3 text-xs sm:text-sm border-b border-gray-200 pb-1.5 sm:pb-2">Legend</h3>
      <div className="space-y-2 sm:space-y-2.5 max-h-[300px] sm:max-h-[400px] overflow-y-auto">
        {activeLayersList.map((layer) => (
          <div key={layer.id} className="flex items-center space-x-2 sm:space-x-3 text-xs sm:text-sm">
            <div className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0">
              {layer.type === 'point' ? (
                <div 
                  className="w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: layer.color }}
                />
              ) : (
                <div
                  className="w-4 h-4 sm:w-5 sm:h-5 border-2 rounded"
                  style={{ 
                    borderColor: layer.color,
                    backgroundColor: `${layer.color}55`
                  }}
                />
              )}
            </div>
            <span className="text-gray-700 text-xs leading-tight truncate">{layer.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}


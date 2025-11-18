import { FaTree, FaMapMarkerAlt, FaSeedling, FaShieldAlt, FaExclamationTriangle, FaArrowDown } from 'react-icons/fa'

export default function StatisticsCards({ layerData, activeLayers }) {
  // Calculate statistics from active layers
  const stats = {
    forestCover: '4.8%',
    biodiversityHotspots: activeLayers.size > 0 ? activeLayers.size * 6 : 36,
    restorationAreas: '1.2M ha',
    protectedAreas: '14.1%',
    speciesAtRisk: 177,
    deforestationRate: '-0.5%'
  }

  const cards = [
    { 
      label: 'Forest Cover', 
      value: stats.forestCover, 
      color: 'bg-green-500',
      icon: FaTree,
      iconColor: 'text-green-600'
    },
    { 
      label: 'Biodiversity Hotspots', 
      value: stats.biodiversityHotspots, 
      color: 'bg-blue-500',
      icon: FaMapMarkerAlt,
      iconColor: 'text-blue-600'
    },
    { 
      label: 'Restoration Areas', 
      value: stats.restorationAreas, 
      color: 'bg-purple-500',
      icon: FaSeedling,
      iconColor: 'text-purple-600'
    },
    { 
      label: 'Protected Areas', 
      value: stats.protectedAreas, 
      color: 'bg-yellow-500',
      icon: FaShieldAlt,
      iconColor: 'text-yellow-600'
    },
    { 
      label: 'Species at Risk', 
      value: stats.speciesAtRisk, 
      color: 'bg-red-500',
      icon: FaExclamationTriangle,
      iconColor: 'text-red-600'
    },
    { 
      label: 'Deforestation Rate', 
      value: stats.deforestationRate, 
      color: 'bg-orange-500',
      icon: FaArrowDown,
      iconColor: 'text-orange-600'
    }
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4 px-2 sm:px-4 py-3 sm:py-4 bg-white border-b border-gray-200 overflow-x-auto">
      {cards.map((card, index) => {
        const IconComponent = card.icon
        return (
          <div
            key={index}
            className="stat-card bg-white rounded-lg border border-gray-200 p-2 sm:p-3 md:p-4 shadow-sm hover:shadow-lg hover:border-green-400 hover:ring-2 hover:ring-green-300 hover:ring-opacity-50 transition-all duration-300 cursor-pointer transform hover:scale-105 min-w-0"
          >
            <div className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 ${card.color} rounded-lg mb-2 sm:mb-3 flex items-center justify-center transition-all duration-300 group-hover:shadow-lg`}>
              <IconComponent className={`text-base sm:text-lg md:text-xl ${card.iconColor} opacity-90 transition-all duration-300`} />
            </div>
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-0.5 sm:mb-1 transition-colors duration-300 truncate">{card.value}</div>
            <div className="text-xs text-gray-600 transition-colors duration-300 line-clamp-2">{card.label}</div>
          </div>
        )
      })}
    </div>
  )
}


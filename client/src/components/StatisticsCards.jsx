import { FaGlobe, FaTree, FaSeedling, FaShieldAlt, FaExclamationTriangle, FaLeaf } from 'react-icons/fa'

export default function StatisticsCards({ layerData, activeLayers }) {
  // Calculate statistics from active layers
  const stats = {
    totalProvincialArea: '729,71 Sq Km',
    forestArea: '329,721 Hectare',
    totalProvincialAreaHectares: '729,710,0 Hectares',
    restorationAreas: '1.2M ha',
    protectedAreas: '14.1%',
    speciesAtRisk: 177,
    deforestationRate: '-0.5%'
  }

  const cards = [
    { 
      label: 'Total Provincial Area', 
      value: stats.totalProvincialArea, 
      color: 'bg-blue-500',
      icon: FaGlobe,
      iconColor: 'text-blue-600'
    },
    { 
      label: '', 
      value: '56%',
      subtitle: 'Current protected coverage',
      color: 'bg-yellow-500',
      icon: FaShieldAlt,
      iconColor: 'text-yellow-600'
    },
    { 
      label: '', 
      value: '329,721 Hectare Forest Area',
      subtitle: 'Forest Area percentage 3.58%',
      color: 'bg-green-500',
      icon: FaTree,
      iconColor: 'text-green-600'
    },
    { 
      label: '', 
      value: 'Enhancement 2299 Hectare\nDeforestation 485 Hectare',
      subtitle: 'Degraded Ecosystems',
      color: 'bg-purple-500',
      icon: FaSeedling,
      iconColor: 'text-purple-600'
    },
    { 
      label: '', 
      value: '94%',
      subtitle: 'Protected Areas Coverage of (KBAs)',
      color: 'bg-red-500',
      icon: FaExclamationTriangle,
      iconColor: 'text-red-600'
    },
    { 
      label: '', 
      value: '830709 Mg/Km2',
      subtitle: 'Carbon Storage',
      color: 'bg-green-600',
      icon: FaLeaf,
      iconColor: 'text-green-700'
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
            <div className="text-sm sm:text-base md:text-lg font-bold text-gray-800 mb-0.5 sm:mb-1 transition-colors duration-300 break-words leading-tight">{card.value}</div>
            {card.subtitle && (
              <div className="text-xs text-gray-500 transition-colors duration-300 mb-0.5 leading-tight whitespace-pre-line">{card.subtitle}</div>
            )}
            {card.label && (
            <div className="text-xs text-gray-600 transition-colors duration-300 line-clamp-2">{card.label}</div>
            )}
          </div>
        )
      })}
    </div>
  )
}


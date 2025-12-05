import { useState, useEffect, useRef } from 'react'
import { FaGlobe, FaTree, FaSeedling, FaShieldAlt, FaExclamationTriangle, FaLeaf, FaCut, FaCloud, FaSitemap, FaMoneyBill, FaWater, FaStarOfLife } from 'react-icons/fa'

// Typewriter animation component for numbers
function TypewriterNumber({ value, delay = 30, index = 0 }) {
  const [displayValue, setDisplayValue] = useState('')
  const [isAnimating, setIsAnimating] = useState(false)
  const hasAnimated = useRef(false)
  const lastValueRef = useRef('')

  useEffect(() => {
    // Reset animation if value changes (e.g., when region changes)
    if (lastValueRef.current !== value) {
      hasAnimated.current = false
      setDisplayValue('')
      setIsAnimating(false)
      lastValueRef.current = value
    }
    
    // Only animate once per value
    if (hasAnimated.current) return
    
    // Stagger animation start for each card
    const startDelay = index * 100
    
    const startAnimation = setTimeout(() => {
      setIsAnimating(true)
      hasAnimated.current = true
      
      // Extract the numeric part and any suffix (like %)
      const match = value.match(/^([\d,]+)(.*)$/)
      if (!match) {
        setDisplayValue(value)
        setIsAnimating(false)
        return
      }
      
      const numericPart = match[1]
      const suffix = match[2] || ''
      
      // Remove commas for animation
      const cleanNumber = numericPart.replace(/,/g, '')
      let currentIndex = 0
      
      const animate = () => {
        if (currentIndex <= cleanNumber.length) {
          // Add back commas as we build the number
          let partialNumber = cleanNumber.substring(0, currentIndex)
          
          // Add commas for thousands
          if (partialNumber.length > 3) {
            partialNumber = partialNumber.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
          }
          
          setDisplayValue(partialNumber + suffix)
          currentIndex++
          setTimeout(animate, delay)
        } else {
          setIsAnimating(false)
        }
      }
      
      animate()
    }, startDelay)
    
    return () => {
      clearTimeout(startAnimation)
    }
  }, [value, delay, index])

  return (
    <span className="font-bold inline-block" style={{ fontVariantNumeric: 'tabular-nums' }}>
      {displayValue || (hasAnimated.current ? value : '')}
      {isAnimating && (
        <span 
          className="inline-block ml-0.5 animate-pulse text-gray-500"
          style={{ 
            animation: 'blink 1s infinite',
            width: '2px',
            height: '1em',
            backgroundColor: 'currentColor',
            verticalAlign: 'baseline'
          }}
        >
        </span>
      )}
    </span>
  )
}

export default function StatisticsCards({ layerData, activeLayers, selectedRegion = 'Gilgit Baltistan' }) {
  // Region-specific statistics data
  const regionStats = {
    'Gilgit Baltistan': [
    { 
      label: 'Sq Km Total Provincial Area', 
        value: '72,971', 
      color: 'bg-blue-500',
      icon: FaGlobe,
      iconColor: 'text-blue-600'
    },
    { 
      label: '', 
      value: '329,721',
      subtitle: 'Hectare Forest Area 3.58%',
      color: 'bg-green-500',
      icon: FaTree,
      iconColor: 'text-green-600'
    },
    { 
      label: '', 
      value: '485',
      valueText: 'Hectare Deforestation',
      subtitle: 'Degraded Ecosystems',
      color: 'bg-red-600',
      icon: FaCut,
      iconColor: 'text-red-800'
    },
      { 
        label: '', 
        value: '2,299',
        valueText: 'Hectare Enhancement',
        subtitle: 'Degraded Ecosystems',
        color: 'bg-green-600',
        icon: FaSeedling,
        iconColor: 'text-green-800'
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
      value: '94%',
      subtitle: 'Protected Areas Coverage of (KBAs)',
      color: 'bg-red-500',
      icon: FaExclamationTriangle,
      iconColor: 'text-red-600'
    },
    { 
      label: '', 
      value: '830,709',
      subtitle: 'Mg/Km2 Carbon Storage',
      color: '#14b8a6',
      icon: FaCloud,
      iconColor: '#ffffff'
    }
    ],
    'Punjab': [
      { 
        label: 'Sq Km Total Provincial Area', 
        value: '205,344', 
        color: 'bg-blue-500',
        icon: FaGlobe,
        iconColor: 'text-blue-600'
      },
      { 
        label: '', 
        value: '535,106',
        subtitle: 'Hectare Forest Area 2.6%',
        color: 'bg-green-500',
        icon: FaTree,
        iconColor: 'text-green-600'
      },
      { 
        label: '', 
        value: '7,380',
        valueText: 'Hectare Deforestation',
        subtitle: 'Degraded Ecosystems',
        color: 'bg-red-600',
        icon: FaCut,
        iconColor: 'text-red-800'
      },
      { 
        label: '', 
        value: '6,774',
        valueText: 'Hectare Enhancement',
        subtitle: 'Degraded Ecosystems',
        color: 'bg-green-600',
        icon: FaSeedling,
        iconColor: 'text-green-800'
      },
      { 
        label: '', 
        value: '1%',
        subtitle: 'Current protected forest coverage',
        color: 'bg-yellow-500',
        icon: FaShieldAlt,
        iconColor: 'text-yellow-600'
      },
      { 
        label: '', 
        value: '33%',
        subtitle: 'Protected Areas Coverage of (KBAs)',
        color: 'bg-red-500',
        icon: FaExclamationTriangle,
        iconColor: 'text-red-600'
      },
      { 
        label: '', 
        value: '310,024,9',
      subtitle: 'Mg/Km2 Carbon Storage',
      color: '#14b8a6',
      icon: FaCloud,
      iconColor: '#ffffff'
    }
  ],
    'Sindh': [
      { 
        label: 'million ha Total Provincial Area', 
        value: '14.09', 
        color: 'bg-blue-500',
        icon: FaGlobe,
        iconColor: 'text-blue-600'
      },
      { 
        label: '', 
        value: '296,400',
        subtitle: 'Hectare Forest Area ~2.1% of land',
        color: 'bg-green-500',
        icon: FaTree,
        iconColor: 'text-green-600'
      },
      { 
        label: '', 
        value: '0.26',
        valueText: 'million acres Restoration Area',
        subtitle: '36% of total forest area Sindh',
        color: 'bg-red-600',
        icon: FaSeedling,
        iconColor: 'text-red-800'
      },
      { 
        label: '', 
        value: '≈1.75',
        subtitle: '≈million ha Protected Areas',
        color: 'bg-yellow-500',
        icon: FaShieldAlt,
        iconColor: 'text-yellow-600'
      },
      { 
        label: '', 
        value: '10',
        valueText: 'Ramsar Sites',
        color: 'bg-green-600',
        icon: FaWater,
        iconColor: 'text-green-800'
      },
      
      { 
        label: '', 
        value: '7,701.71',
        subtitle: 'PKR million Historial Expenditure  ',
        color: 'bg-green-500',
        icon: FaTree,
        iconColor: 'text-green-600'
      },
      { 
        label: '', 
        value: '8,483.09',
        subtitle: 'PKR million Planned Investment  ',
        color: 'bg-teal-500',
        icon: FaMoneyBill,
        iconColor: 'text-teal-600'
      }
    ],
    'Balochistan': [
      { 
        label: 'Sq Km Total Provincial Area', 
        value: '347,190', 
        color: 'bg-blue-500',
        icon: FaGlobe,
        iconColor: 'text-blue-600'
      },
      { 
        label: '', 
        value: '32.3',
        subtitle: 'million ha Rangelands + forest areas',
        color: 'bg-green-500',
        icon: FaTree,
        iconColor: 'text-green-600'
      },
      { 
        label: '', 
        value: '~650,000',
        subtitle: 'ha of woodlands',
        color: 'bg-green-600',
        icon: FaLeaf,
        iconColor: 'text-green-800'
      },
      { 
        label: '', 
        value: '94%',
        subtitle: 'Protected Areas Coverage of (KBAs)',
        color: 'bg-yellow-500',
        icon: FaShieldAlt,
        iconColor: 'text-yellow-600'
      },
      { 
        label: '', 
        value: '1.8–2.0',
        subtitle: 'million ha Protected Areas',
        color: 'bg-blue-500',
        icon: FaShieldAlt,
        iconColor: 'text-blue-600'
      },
      { 
        label: '', 
        value: '30,000',
        subtitle: 'ha Community/private game reserves',
        color: 'bg-purple-500',
        icon: FaStarOfLife,
        iconColor: 'text-purple-600'
      },
      { 
        label: '', 
        value: '6',
        valueText: 'Ramsar Sites',
        color: 'bg-teal-500',
        icon: FaWater,
        iconColor: 'text-teal-600'
      }
    ],
    'AJK': [
      { 
        label: 'Sq Miles Total Provincial Area', 
        value: '5,134', 
        color: 'bg-blue-500',
        icon: FaGlobe,
        iconColor: 'text-blue-600'
      },
      { 
        label: '', 
        value: '591,000',
        subtitle: 'Hectare Forest Area 1.7%',
        color: 'bg-green-500',
        icon: FaTree,
        iconColor: 'text-green-600'
      },
      { 
        label: '', 
        value: '1,046',
        valueText: 'Hectare Deforestation',
        subtitle: 'Degraded Ecosystems',
        color: 'bg-red-600',
        icon: FaCut,
        iconColor: 'text-red-800'
      },
      { 
        label: '', 
        value: '1,228',
        valueText: 'Hectare Enhancement',
        subtitle: 'Degraded Ecosystems',
        color: 'bg-green-600',
        icon: FaSeedling,
        iconColor: 'text-green-800'
      },
      { 
        label: '', 
        value: '4%',
        subtitle: 'Current wildlife PAs coverage',
        color: 'bg-yellow-500',
        icon: FaShieldAlt,
        iconColor: 'text-yellow-600'
      }
    ]
  }

  // Get cards for the selected region, default to Gilgit Baltistan
  // Handle both 'AJK' (UI) and 'Azad Kashmir' (backend) region names
  const regionKey = selectedRegion === 'Azad Kashmir' ? 'AJK' : selectedRegion
  const cards = regionStats[regionKey] || regionStats['Gilgit Baltistan']

  // Determine grid columns based on number of cards
  const numCards = cards.length
  const gridCols = numCards === 6 
    ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6' 
    : numCards === 5
    ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-5'
    : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-7'
  
  return (
    <div key={selectedRegion} className={`grid ${gridCols} gap-2 px-3 py-2 bg-white border-b border-gray-200 overflow-x-auto`}>
      {cards.map((card, index) => {
        const IconComponent = card.icon
        return (
          <div
            key={`${selectedRegion}-${index}`}
            className="stat-card bg-white rounded-lg border border-gray-200 p-2 shadow-sm hover:shadow-lg hover:border-green-400 hover:ring-2 hover:ring-green-300 hover:ring-opacity-50 transition-all duration-300 cursor-pointer transform hover:scale-105 min-w-0"
          >
            <div 
              className={`w-7 h-7 sm:w-8 sm:h-8 ${card.color.startsWith('#') ? '' : card.color} rounded-lg mb-1 flex items-center justify-center transition-all duration-300 group-hover:shadow-lg`}
              style={card.color.startsWith('#') ? { backgroundColor: card.color } : {}}
            >
              <IconComponent 
                className={`text-xs sm:text-sm md:text-base opacity-90 transition-all duration-300 ${card.iconColor.startsWith('#') ? '' : card.iconColor}`}
                style={card.iconColor.startsWith('#') ? { color: card.iconColor } : {}}
              />
            </div>
            <div className="text-xs sm:text-sm md:text-base text-gray-800 mb-0.5 transition-colors duration-300 break-words leading-tight whitespace-pre-line">
              <TypewriterNumber value={card.value} delay={30} index={index} />
            </div>
            {card.valueText && (
              <div className="text-[10px] sm:text-xs text-gray-500 transition-colors duration-300 mb-0.5 leading-tight whitespace-pre-line">{card.valueText}</div>
            )}
            {card.subtitle && (
              <div className="text-[10px] sm:text-xs text-gray-500 transition-colors duration-300 mb-0.5 leading-tight whitespace-pre-line">{card.subtitle}</div>
            )}
            {card.label && (
            <div className="text-[10px] sm:text-xs text-gray-600 transition-colors duration-300 line-clamp-2">{card.label}</div>
            )}
          </div>
        )
      })}
    </div>
  )
}


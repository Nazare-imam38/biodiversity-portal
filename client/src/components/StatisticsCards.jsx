import { useState, useEffect, useRef } from 'react'
import { FaGlobe, FaTree, FaSeedling, FaShieldAlt, FaExclamationTriangle, FaLeaf, FaCut, FaCloud } from 'react-icons/fa'

// Typewriter animation component for numbers
function TypewriterNumber({ value, delay = 30, index = 0, key = '' }) {
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
  }, [value, delay, index, key])

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
        value: '2.6%',
        subtitle: 'Current protected coverage',
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
        value: '3,100,249',
      subtitle: 'Mg/Km2 Carbon Storage',
      color: '#14b8a6',
      icon: FaCloud,
      iconColor: '#ffffff'
    }
  ]
  }

  // Get cards for the selected region, default to Gilgit Baltistan
  const cards = regionStats[selectedRegion] || regionStats['Gilgit Baltistan']

  return (
    <div key={selectedRegion} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-7 gap-2 sm:gap-3 md:gap-4 px-2 sm:px-4 py-3 sm:py-4 bg-white border-b border-gray-200 overflow-x-auto">
      {cards.map((card, index) => {
        const IconComponent = card.icon
        return (
          <div
            key={`${selectedRegion}-${index}`}
            className="stat-card bg-white rounded-lg border border-gray-200 p-2 sm:p-3 md:p-4 shadow-sm hover:shadow-lg hover:border-green-400 hover:ring-2 hover:ring-green-300 hover:ring-opacity-50 transition-all duration-300 cursor-pointer transform hover:scale-105 min-w-0"
          >
            <div 
              className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 ${card.color.startsWith('#') ? '' : card.color} rounded-lg mb-2 sm:mb-3 flex items-center justify-center transition-all duration-300 group-hover:shadow-lg`}
              style={card.color.startsWith('#') ? { backgroundColor: card.color } : {}}
            >
              <IconComponent 
                className={`text-base sm:text-lg md:text-xl opacity-90 transition-all duration-300 ${card.iconColor.startsWith('#') ? '' : card.iconColor}`}
                style={card.iconColor.startsWith('#') ? { color: card.iconColor } : {}}
              />
            </div>
            <div className="text-sm sm:text-base md:text-lg text-gray-800 mb-0.5 sm:mb-1 transition-colors duration-300 break-words leading-tight whitespace-pre-line">
              <TypewriterNumber value={card.value} delay={30} index={index} key={`${selectedRegion}-${index}-${card.value}`} />
            </div>
            {card.valueText && (
              <div className="text-xs text-gray-500 transition-colors duration-300 mb-0.5 leading-tight whitespace-pre-line">{card.valueText}</div>
            )}
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


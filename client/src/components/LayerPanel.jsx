import { useState, useEffect } from 'react'
import { 
  FaLeaf, 
  FaTree, 
  FaMountain, 
  FaSun, 
  FaShieldAlt, 
  FaSeedling, 
  FaLink, 
  FaWater,
  FaTimes,
  FaBars,
  FaMapMarkedAlt,
  FaMapMarkerAlt,
  FaTrash
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
}

export default function LayerPanel({ layers, activeLayers, onToggleLayer, onClearAll }) {
  const [isMobile, setIsMobile] = useState(false)
  // Desktop: open by default, Mobile: closed by default
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024
    }
    return true
  })

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleToggle = (layerId, e) => {
    e.stopPropagation()
    onToggleLayer(layerId)
  }

  return (
    <>
      {/* Mobile toggle button - Fixed position */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed bottom-6 right-6 z-50 bg-green-600 text-white p-4 rounded-full shadow-2xl hover:bg-green-700 transition-all transform hover:scale-110 active:scale-95"
        aria-label="Toggle layers panel"
        style={{ 
          boxShadow: '0 10px 25px rgba(34, 197, 94, 0.4)'
        }}
      >
        {isOpen ? <FaTimes className="text-white text-xl" /> : <FaBars className="text-white text-xl" />}
      </button>

      {/* Desktop Sidebar / Mobile Bottom Sheet */}
      <div
        className={`${
          // Mobile: bottom sheet from bottom
          isOpen ? 'translate-y-0' : 'translate-y-full'
        } lg:translate-y-0 lg:translate-x-0 fixed lg:static inset-x-0 lg:inset-x-auto bottom-0 lg:bottom-auto left-0 lg:left-auto w-full lg:w-64 xl:w-72 bg-white shadow-2xl lg:shadow-lg z-40 transition-transform duration-300 ease-in-out overflow-hidden lg:overflow-y-auto border-t lg:border-t-0 lg:border-r border-gray-200 flex flex-col rounded-t-3xl lg:rounded-none`}
        style={{ 
          // Mobile: bottom sheet with max height
          maxHeight: !isMobile ? 'calc(100vh - 140px)' : (isOpen ? '85vh' : '0'),
          height: !isMobile ? 'calc(100vh - 140px)' : (isOpen ? '85vh' : '0'),
          top: !isMobile ? '140px' : 'auto'
        }}
      >
        {/* Mobile: Drag handle */}
        <div className="lg:hidden flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
        </div>

        <div className="p-4 sm:p-5 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Data Layers</h2>
            <div className="flex items-center space-x-2">
              {activeLayers.size > 0 && (
                <button
                  onClick={onClearAll}
                  className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-red-600 bg-red-50 border border-red-300 rounded-lg hover:bg-red-100 hover:border-red-400 transition-all"
                  title="Clear all layers"
                >
                  <FaTrash className="text-xs sm:text-sm" />
                  <span className="hidden sm:inline">Clear All</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="lg:hidden text-gray-500 hover:text-gray-700 p-1"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>
          </div>

          <div className="space-y-2.5">
            {layers && layers.length > 0 ? (
              layers.map((layer) => {
                const IconComponent = layerIcons[layer.id] || FaLeaf
                return (
                  <LayerItem
                    key={layer.id}
                    layer={layer}
                    icon={IconComponent}
                    isActive={activeLayers.has(layer.id)}
                    onToggle={(e) => handleToggle(layer.id, e)}
                  />
                )
              })
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">
                <p>No layers available. Please check if the backend server is running.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overlay for mobile bottom sheet */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
          style={{ top: '0', left: '0' }}
        />
      )}
    </>
  )
}

function LayerItem({ layer, icon: Icon, isActive, onToggle }) {
  return (
    <div
      className={`p-3 sm:p-4 rounded-lg border transition-all cursor-pointer ${
        isActive
          ? 'border-green-500 bg-green-50 shadow-sm'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
      }`}
      onClick={(e) => {
        // Toggle when clicking anywhere on the card
        onToggle(e)
      }}
    >
      <div className="flex items-center justify-between gap-3 w-full">
        <div className="flex items-center space-x-3 flex-1 min-w-0 pr-2">
          <div className={`p-2 sm:p-2.5 rounded-lg flex-shrink-0 ${isActive ? 'bg-green-100' : 'bg-gray-100'}`}>
            <Icon className={`text-base sm:text-lg ${isActive ? 'text-green-600' : 'text-gray-600'}`} />
          </div>
          <div className="flex-1 min-w-0 overflow-hidden">
            <h3 className="font-medium text-sm sm:text-base text-gray-800 truncate leading-tight">{layer.name}</h3>
            <p className="text-xs sm:text-sm text-gray-500 truncate leading-tight mt-0.5 sm:mt-1">{layer.description}</p>
          </div>
        </div>
        <div 
          className="flex-shrink-0 w-12 sm:w-14" 
          onClick={(e) => {
            e.stopPropagation()
            onToggle(e)
          }}
        >
          <label className="relative inline-flex items-center cursor-pointer w-full">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => {
                e.stopPropagation()
                onToggle(e)
              }}
              className="sr-only peer"
            />
            <div className={`w-12 sm:w-14 h-7 sm:h-8 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 sm:after:h-7 sm:after:w-7 after:transition-all peer-checked:bg-green-500`}></div>
          </label>
        </div>
      </div>
    </div>
  )
}

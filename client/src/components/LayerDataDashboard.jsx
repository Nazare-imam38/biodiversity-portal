import { useMemo, useState, useEffect, useRef } from 'react'
import { FaTable, FaInfoCircle, FaChevronLeft, FaChevronRight, FaChevronUp, FaChevronDown, FaAngleDown, FaAngleUp } from 'react-icons/fa'

// Define which columns to display for each layer type
const layerColumnMappings = {
  'agroecological-zones': {
    columns: ['pk_key', 'pk_name', 'Area', 'AreaWise', 'Label'],
    displayNames: {
      'pk_key': 'Key',
      'pk_name': 'Zone Name',
      'Area': 'Area',
      'AreaWise': 'Area (%)',
      'Label': 'Label'
    }
  },
  'ecoregions': {
    columns: ['ECO_NAME', 'BIOME_NAME', 'REALM', 'ECO_BIOME_', 'NNH_NAME'],
    displayNames: {
      'ECO_NAME': 'Ecoregion Name',
      'BIOME_NAME': 'Biome',
      'REALM': 'Realm',
      'ECO_BIOME_': 'Eco-Biome',
      'NNH_NAME': 'NNH Status'
    }
  },
  'kbas': {
    columns: ['NatName', 'IntName', 'SitLat', 'SitLong', 'SitAreaKM2', 'KbaStatus', 'IbaStatus'],
    displayNames: {
      'NatName': 'National Name',
      'IntName': 'International Name',
      'SitLat': 'Latitude',
      'SitLong': 'Longitude',
      'SitAreaKM2': 'Area (km²)',
      'KbaStatus': 'KBA Status',
      'IbaStatus': 'IBA Status'
    }
  },
  'protected-areas': {
    columns: ['NAME', 'DESIG', 'DESIG_ENG', 'IUCN_CAT', 'STATUS', 'STATUS_YR', 'REP_AREA'],
    displayNames: {
      'NAME': 'Name',
      'DESIG': 'Designation',
      'DESIG_ENG': 'Designation (English)',
      'IUCN_CAT': 'IUCN Category',
      'STATUS': 'Status',
      'STATUS_YR': 'Status Year',
      'REP_AREA': 'Reported Area'
    }
  },
  'protected-areas-pol': {
    columns: ['NAME', 'DESIG', 'DESIG_ENG', 'IUCN_CAT', 'STATUS', 'STATUS_YR', 'GIS_AREA'],
    displayNames: {
      'NAME': 'Name',
      'DESIG': 'Designation',
      'DESIG_ENG': 'Designation (English)',
      'IUCN_CAT': 'IUCN Category',
      'STATUS': 'Status',
      'STATUS_YR': 'Status Year',
      'GIS_AREA': 'GIS Area'
    }
  },
  'protected-forest': {
    columns: ['F_Zone', 'F_Circle', 'F_Div', 'F_Name', 'GPS_Area', 'Gross_Area', 'F_Type', 'Legal_Stat'],
    displayNames: {
      'F_Zone': 'Zone',
      'F_Circle': 'Circle',
      'F_Div': 'Division',
      'F_Name': 'Forest Name',
      'GPS_Area': 'GPS Area',
      'Gross_Area': 'Gross Area',
      'F_Type': 'Forest Type',
      'Legal_Stat': 'Legal Status'
    }
  },
  'ramsar-sites': {
    columns: ['Site_name', 'Name', 'Region', 'Country', 'Designatio', 'Area__ha_', 'Shape_Area', 'Latitude', 'Longitude', 'Wetland_Ty', 'Shape_Leng'],
    displayNames: {
      'Site_name': 'Site Name',
      'Name': 'Site Name',
      'Region': 'Region',
      'Country': 'Country',
      'Designatio': 'Designation Date',
      'Area__ha_': 'Area (ha)',
      'Shape_Area': 'Area (sq units)',
      'Latitude': 'Latitude',
      'Longitude': 'Longitude',
      'Wetland_Ty': 'Wetland Type',
      'Shape_Leng': 'Perimeter/Length'
    }
  },
  'wildlife-occurrence': {
    columns: ['Species', 'Common_nam', 'X_Longi', 'Y_Lati'],
    displayNames: {
      'Species': 'Species',
      'Common_nam': 'Common Name',
      'X_Longi': 'Longitude',
      'Y_Lati': 'Latitude'
    }
  }
}

// Format value for display
function formatValue(value) {
  if (value === null || value === undefined || value === '') {
    return 'N/A'
  }
  if (typeof value === 'number') {
    // Format numbers with appropriate decimal places
    if (Number.isInteger(value)) {
      return value.toLocaleString()
    }
    return value.toFixed(6)
  }
  if (typeof value === 'string' && value.length > 100) {
    return value.substring(0, 100) + '...'
  }
  return String(value)
}

// Format date value
function formatDate(value) {
  if (!value) return 'N/A'
  try {
    const date = new Date(value)
    if (isNaN(date.getTime())) return String(value)
    return date.toLocaleDateString()
  } catch {
    return String(value)
  }
}

// Helper function to generate a unique feature ID (must match MapView)
function getFeatureId(feature, layerId) {
  const props = feature.properties || {}
  
  // For wildlife occurrence, use Species + coordinates
  if (layerId === 'wildlife-occurrence') {
    return `${props.Species || 'unknown'}_${props.X_Longi}_${props.Y_Lati}`
  }
  
  // For other layers, try common ID fields
  if (props.WDPAID) return `${layerId}_${props.WDPAID}`
  if (props.SitRecID) return `${layerId}_${props.SitRecID}`
  if (props.Ramsar_Sit) return `${layerId}_${props.Ramsar_Sit}`
  if (props.pk_key) return `${layerId}_${props.pk_key}`
  if (props.OBJECTID) return `${layerId}_${props.OBJECTID}`
  if (props.NAME) return `${layerId}_${props.NAME}_${props.Latitude || props.SitLat || ''}_${props.Longitude || props.SitLong || ''}`
  
  // Fallback: use coordinates if available
  if (feature.geometry && feature.geometry.coordinates) {
    const coords = feature.geometry.coordinates
    if (Array.isArray(coords[0])) {
      return `${layerId}_${coords[0][0]}_${coords[0][1]}`
    }
    return `${layerId}_${coords[0]}_${coords[1]}`
  }
  
  // Last resort: use index (not ideal but works)
  return `${layerId}_${Math.random()}`
}

// Component for fallback table (no column mapping)
function FallbackLayerTable({ layerId, layer, data, selectedFeature, tableRefs }) {
  const [isExpanded, setIsExpanded] = useState(true)
  const sampleFeature = data.features[0]
  if (!sampleFeature || !sampleFeature.properties) {
    return null
  }
  const allKeys = Object.keys(sampleFeature.properties).slice(0, 10)
  
  // Find selected feature index for auto-scroll
  const selectedFeatureIndex = useMemo(() => {
    if (!selectedFeature || selectedFeature.layerId !== layerId) return null
    
    return data.features.findIndex(f => {
      const featureId = getFeatureId(f, layerId)
      return featureId === selectedFeature.featureId
    })
  }, [selectedFeature, layerId, data.features])
  
  // Auto-scroll to selected feature
  useEffect(() => {
    if (selectedFeatureIndex !== null && selectedFeatureIndex !== -1 && tableRefs.current[layerId]) {
      setTimeout(() => {
        const rowElement = tableRefs.current[layerId]?.querySelector(`tr[data-feature-index="${selectedFeatureIndex}"]`)
        if (rowElement) {
          rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
          const dashboardContainer = rowElement.closest('.max-h-\\[600px\\]')
          if (dashboardContainer) {
            dashboardContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
          }
        }
      }, 100)
    }
  }, [selectedFeatureIndex, layerId, tableRefs])
  
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden shadow-lg bg-white hover:shadow-xl transition-shadow duration-300">
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-gray-900" style={{ color: layer?.color || '#22c55e' }}>
              {layer?.name || layerId}
            </h3>
            <p className="text-xs text-gray-600 mt-0.5 font-medium">{data.features.length} feature(s)</p>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-4 p-2.5 text-gray-600 hover:text-white hover:bg-gradient-to-br hover:from-green-500 hover:to-green-600 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
            aria-label={isExpanded ? "Collapse" : "Expand"}
            title={isExpanded ? "Collapse table" : "Expand table"}
          >
            {isExpanded ? (
              <FaAngleUp className="text-lg" />
            ) : (
              <FaAngleDown className="text-lg" />
            )}
          </button>
        </div>
      </div>
      {isExpanded && (
        <div className="overflow-x-auto bg-white" ref={el => { if (el) tableRefs.current[layerId] = el }}>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-100 to-gray-50">
              <tr>
                  {allKeys.map(key => (
                    <th key={key} className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">
                      {key}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
            {data.features.slice(0, 50).map((feature, idx) => {
              const featureId = getFeatureId(feature, layerId)
              const isSelected = selectedFeature && 
                                selectedFeature.layerId === layerId && 
                                selectedFeature.featureId === featureId
              
              return (
                <tr 
                  key={idx}
                  data-feature-index={idx}
                  className={`transition-all duration-200 ${
                    isSelected 
                      ? 'bg-gradient-to-r from-green-50 to-green-100 border-l-4 border-green-500 font-semibold shadow-sm' 
                      : 'hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:shadow-sm'
                  } ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                >
                  {allKeys.map(key => (
                    <td 
                      key={key} 
                      className={`px-4 py-3 text-xs font-medium ${
                        isSelected ? 'text-green-900' : 'text-gray-800'
                      }`}
                    >
                      {formatValue(feature.properties[key])}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      )}
    </div>
  )
}

// Component for individual layer table with pagination
function LayerTable({ layerId, layer, data, columnMapping, selectedFeature, tableRefs }) {
  const [currentPage, setCurrentPage] = useState(1)
  const [isExpanded, setIsExpanded] = useState(true)
  const itemsPerPage = 10
  const totalFeatures = data.features.length
  const showPagination = totalFeatures > 300
  const totalPages = showPagination ? Math.ceil(totalFeatures / itemsPerPage) : 1
  
  // Calculate pagination
  const startIndex = showPagination ? (currentPage - 1) * itemsPerPage : 0
  const endIndex = showPagination ? startIndex + itemsPerPage : Math.min(totalFeatures, 100)
  const paginatedFeatures = data.features.slice(startIndex, endIndex)
  
  // Find selected feature index
  const selectedFeatureIndex = useMemo(() => {
    if (!selectedFeature || selectedFeature.layerId !== layerId) return null
    
    return data.features.findIndex(f => {
      const featureId = getFeatureId(f, layerId)
      return featureId === selectedFeature.featureId
    })
  }, [selectedFeature, layerId, data.features])
  
  // Auto-scroll to selected feature when it changes
  useEffect(() => {
    if (selectedFeatureIndex !== null && selectedFeatureIndex !== -1 && tableRefs.current[layerId]) {
      // If pagination is enabled, navigate to the correct page
      if (showPagination) {
        const pageForFeature = Math.floor(selectedFeatureIndex / itemsPerPage) + 1
        setCurrentPage(pageForFeature)
      }
      
      // Scroll to the row
      setTimeout(() => {
        const rowElement = tableRefs.current[layerId]?.querySelector(`tr[data-feature-index="${selectedFeatureIndex}"]`)
        if (rowElement) {
          rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
          // Also scroll the dashboard container to make sure the table is visible
          const dashboardContainer = rowElement.closest('.max-h-\\[600px\\]')
          if (dashboardContainer) {
            dashboardContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
          }
        }
      }, 100)
    }
  }, [selectedFeatureIndex, layerId, showPagination, itemsPerPage, tableRefs])
  
  const { columns, displayNames } = columnMapping
  let visibleColumns = columns.filter(col => {
    // Check if at least one feature has this property
    return data.features.some(f => f.properties && f.properties[col] != null)
  })
  // For ramsar-sites, prefer 'Name' over 'Site_name' if both exist
  if (layerId === 'ramsar-sites' && visibleColumns.includes('Name') && visibleColumns.includes('Site_name')) {
    visibleColumns = visibleColumns.filter(col => col !== 'Site_name')
  }

  if (visibleColumns.length === 0) {
    return null
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-gray-900" style={{ color: layer?.color || '#22c55e' }}>
                  {layer?.name || layerId}
                </h3>
                <p className="text-xs text-gray-600 mt-0.5 font-medium">
                  {showPagination 
                    ? `Showing ${startIndex + 1}-${Math.min(endIndex, totalFeatures)} of ${totalFeatures} feature(s)`
                    : `${totalFeatures} feature(s)`
                  }
                </p>
              </div>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="ml-4 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
                aria-label={isExpanded ? "Collapse" : "Expand"}
                title={isExpanded ? "Collapse table" : "Expand table"}
              >
                {isExpanded ? (
                  <FaAngleUp className="text-lg" />
                ) : (
                  <FaAngleDown className="text-lg" />
                )}
              </button>
            </div>
          </div>
          {showPagination && (
            <div className="flex items-center space-x-2 ml-4">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-white border border-gray-300 hover:bg-gradient-to-br hover:from-green-500 hover:to-green-600 hover:text-white hover:border-green-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-600 transition-all duration-200 shadow-sm hover:shadow-md"
                aria-label="Previous page"
              >
                <FaChevronLeft className="text-sm" />
              </button>
              <span className="text-sm text-gray-700 font-bold px-3 py-1.5 bg-white rounded-lg border border-gray-300 shadow-sm">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-white border border-gray-300 hover:bg-gradient-to-br hover:from-green-500 hover:to-green-600 hover:text-white hover:border-green-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-600 transition-all duration-200 shadow-sm hover:shadow-md"
                aria-label="Next page"
              >
                <FaChevronRight className="text-sm" />
              </button>
            </div>
          )}
        </div>
        {showPagination && (
          <div className="mt-3 flex flex-wrap gap-2">
            {Array.from({ length: Math.min(totalPages, 30) }, (_, i) => i + 1).map(pageNum => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 shadow-sm ${
                  currentPage === pageNum
                    ? 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-md transform scale-105'
                    : 'bg-white text-gray-700 hover:bg-gradient-to-br hover:from-green-50 hover:to-green-100 hover:text-green-700 border border-gray-300 hover:border-green-400 hover:shadow-md'
                }`}
              >
                {pageNum}
              </button>
            ))}
            {totalPages > 30 && (
              <span className="px-3 py-1.5 text-xs text-gray-500 font-medium">...</span>
            )}
          </div>
        )}
      </div>
      {isExpanded && (
        <div className="overflow-x-auto bg-white" ref={el => { if (el) tableRefs.current[layerId] = el }}>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-100 to-gray-50 sticky top-0 z-20">
              <tr>
                {visibleColumns.map(col => (
                  <th key={col} className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">
                    {displayNames[col] || col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
            {paginatedFeatures.map((feature, idx) => {
              const featureIndex = startIndex + idx
              const featureId = getFeatureId(feature, layerId)
              const isSelected = selectedFeature && 
                                selectedFeature.layerId === layerId && 
                                selectedFeature.featureId === featureId
              
                return (
                  <tr 
                    key={featureIndex}
                    data-feature-index={featureIndex}
                    className={`transition-all duration-200 ${
                      isSelected 
                        ? 'bg-gradient-to-r from-green-50 to-green-100 border-l-4 border-green-500 font-semibold shadow-sm' 
                        : 'hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:shadow-sm'
                    } ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                  >
                    {visibleColumns.map(col => {
                      const value = feature.properties?.[col]
                      // Format dates specially
                      let displayValue = formatValue(value)
                      if (col === 'Designatio' && value) {
                        displayValue = formatDate(value)
                      }
                      // Format Shape_Area to be more readable
                      if (col === 'Shape_Area' && typeof value === 'number') {
                        displayValue = value.toFixed(8) + ' sq units'
                      }
                      // Format Shape_Leng to be more readable
                      if (col === 'Shape_Leng' && typeof value === 'number') {
                        displayValue = value.toFixed(6) + ' units'
                      }
                      return (
                        <td 
                          key={col} 
                          className={`px-4 py-3 text-xs font-medium whitespace-nowrap ${
                            isSelected ? 'text-green-900' : 'text-gray-800'
                          }`}
                        >
                          {displayValue}
                        </td>
                      )
                    })}
                  </tr>
                )
            })}
          </tbody>
        </table>
      </div>
      )}
    </div>
  )
}

export default function LayerDataDashboard({ layerData, activeLayers, layers, selectedRegion, selectedFeature }) {
  // All hooks must be called before any conditional returns (Rules of Hooks)
  const tableRefs = useRef({})
  const scrollContainerRef = useRef(null)
  const [canScrollUp, setCanScrollUp] = useState(false)
  const [canScrollDown, setCanScrollDown] = useState(false)

  // Get active data layers (exclude boundary and raster layers)
  const dataLayers = useMemo(() => {
    const excludedLayers = [
      'pakistan-provinces',
      'gb-provincial',
      'gb-district',
      'punjab-provincial',
      'balochistan-provincial',
      'sindh-provincial',
      'kp-provincial',
      'ajk-provincial',
      'punjab-lulc', // Raster layer
      'pakistan-lulc', // Raster layer
      'sindh-lulc', // Raster layer
      'balochistan-lulc' // Raster layer
    ]
    
    return Array.from(activeLayers)
      .filter(layerId => !excludedLayers.includes(layerId))
      .map(layerId => {
        const layer = layers.find(l => l.id === layerId)
        const data = layerData[layerId]
        return { layerId, layer, data }
      })
      .filter(({ data }) => data && data.features && data.features.length > 0)
  }, [activeLayers, layerData, layers])

  // Check scroll position to show/hide scroll buttons
  // This useEffect must be called before any conditional returns (Rules of Hooks)
  useEffect(() => {
    // Early return inside useEffect is fine - it's not a component return
    // Allow all provinces to show the dashboard
    const isProvince = selectedRegion === 'Gilgit Baltistan' || 
                      selectedRegion === 'Punjab' || 
                      selectedRegion === 'Sindh' || 
                      selectedRegion === 'Balochistan' || 
                      selectedRegion === 'Khyber Pakhtunkhwa' || 
                      selectedRegion === 'KP' || 
                      selectedRegion === 'AJK' ||
                      selectedRegion === 'Azad Kashmir'
    
    if (!isProvince) {
      return
    }
    
    if (dataLayers.length === 0) {
      return
    }

    const checkScrollPosition = () => {
      if (scrollContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
        const isScrollable = scrollHeight > clientHeight
        setCanScrollUp(isScrollable && scrollTop > 50)
        setCanScrollDown(isScrollable && scrollTop < scrollHeight - clientHeight - 50)
      }
    }

    const container = scrollContainerRef.current
    if (container) {
      // Initial check
      checkScrollPosition()
      
      // Check on scroll
      container.addEventListener('scroll', checkScrollPosition)
      
      // Check when window resizes
      window.addEventListener('resize', checkScrollPosition)
      
      // Also check when data changes (with a small delay to allow DOM to update)
      const observer = new MutationObserver(() => {
        setTimeout(checkScrollPosition, 100)
      })
      observer.observe(container, { childList: true, subtree: true })
      
      // Periodic check to catch any missed updates
      const intervalId = setInterval(checkScrollPosition, 500)
      
      return () => {
        container.removeEventListener('scroll', checkScrollPosition)
        window.removeEventListener('resize', checkScrollPosition)
        observer.disconnect()
        clearInterval(intervalId)
      }
    }
  }, [dataLayers, selectedRegion])

  // Single scroll button handler - scrolls up or down based on position
  const handleScroll = () => {
    if (!scrollContainerRef.current) return
    
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
    const isNearBottom = scrollTop >= scrollHeight - clientHeight - 100
    
    if (isNearBottom) {
      // If near bottom, scroll to top
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    } else {
      // Otherwise, scroll down
      scrollContainerRef.current.scrollBy({
        top: 300,
        behavior: 'smooth'
      })
    }
  }

  return (
    <div className="w-full bg-white border-t-4 border-green-500 shadow-2xl relative">
      <div className="px-4 py-2.5 border-b-2 border-green-600" style={{ backgroundColor: '#159f48', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
        <div className="flex items-center justify-center space-x-2 relative">
          <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm absolute left-0">
            <FaTable className="text-white text-lg" />
          </div>
          <h2 className="text-sm sm:text-base font-semibold text-white drop-shadow-md" style={{ fontFamily: 'inherit' }}>Layer Data Dashboard</h2>
          <div className="p-1 bg-white/20 rounded-full backdrop-blur-sm absolute right-0">
            <FaInfoCircle className="text-white text-xs" title="Data from active layers" />
          </div>
        </div>
      </div>

      {/* Single scroll button - positioned on the right side */}
      {(canScrollUp || canScrollDown) && (
        <button
          onClick={handleScroll}
          className="absolute right-6 top-1/2 -translate-y-1/2 z-50 bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-full shadow-2xl hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-110 active:scale-95 border-2 border-white"
          aria-label={canScrollDown ? "Scroll down" : "Scroll to top"}
          title={canScrollDown ? "Scroll down" : "Scroll to top"}
        >
          {canScrollDown ? (
            <FaChevronDown className="text-lg font-bold" />
          ) : (
            <FaChevronUp className="text-lg font-bold" />
          )}
        </button>
      )}

      <div 
        ref={scrollContainerRef}
        className="p-3 space-y-4 max-h-[600px] overflow-y-auto relative dashboard-scroll-container"
        style={{ 
          scrollbarWidth: '12px',
          scrollbarColor: '#94a3b8 #f1f5f9'
        }}
      >
        {dataLayers.map(({ layerId, layer, data }) => {
          const columnMapping = layerColumnMappings[layerId]
          if (!columnMapping) {
            return (
              <FallbackLayerTable
                key={layerId}
                layerId={layerId}
                layer={layer}
                data={data}
                selectedFeature={selectedFeature}
                tableRefs={tableRefs}
              />
            )
          }

          const { columns, displayNames } = columnMapping
          let visibleColumns = columns.filter(col => {
            // Check if at least one feature has this property
            return data.features.some(f => f.properties && f.properties[col] != null)
          })
          // For ramsar-sites, prefer 'Name' over 'Site_name' if both exist
          if (layerId === 'ramsar-sites' && visibleColumns.includes('Name') && visibleColumns.includes('Site_name')) {
            visibleColumns = visibleColumns.filter(col => col !== 'Site_name')
          }

          if (visibleColumns.length === 0) {
            return null
          }

          return (
            <LayerTable
              key={layerId}
              layerId={layerId}
              layer={layer}
              data={data}
              columnMapping={columnMapping}
              selectedFeature={selectedFeature}
              tableRefs={tableRefs}
            />
          )
        })}
      </div>
    </div>
  )
}


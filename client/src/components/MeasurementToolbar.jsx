import { useEffect, useRef, useState, useCallback } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import { FaTimes } from 'react-icons/fa'

// Measurement Toolbar Component
export default function MeasurementToolbar() {
  const map = useMap()
  const [activeTool, setActiveTool] = useState(null) // 'distance' or 'area'
  const [measurements, setMeasurements] = useState([])
  const measurementLayerRef = useRef(null)
  const currentMeasurementRef = useRef(null)
  const isDrawingRef = useRef(false)

  // Calculate polygon area using spherical excess (Shoelace formula adapted for spherical coordinates)
  const calculatePolygonArea = useCallback((coords) => {
    if (coords.length < 3) return 0

    const R = 6371000 // Earth radius in meters
    let area = 0

    // Use spherical excess formula for more accurate area calculation
    for (let i = 0; i < coords.length - 1; i++) {
      const p1 = coords[i]
      const p2 = coords[i + 1]
      
      const lat1 = (p1[0] * Math.PI) / 180
      const lat2 = (p2[0] * Math.PI) / 180
      const dLng = ((p2[1] - p1[1]) * Math.PI) / 180

      area += dLng * (2 + Math.sin(lat1) + Math.sin(lat2))
    }

    area = Math.abs(area * R * R / 2)
    return area
  }, [])

  const cleanupMeasurement = useCallback(() => {
    if (currentMeasurementRef.current) {
      currentMeasurementRef.current = null
    }
    isDrawingRef.current = false
  }, [])

  const updateMeasurement = useCallback((tempPoint = null, toolType = null) => {
    if (!currentMeasurementRef.current || !map) return

    const measurement = currentMeasurementRef.current
    const pointsToUse = tempPoint ? [...measurement.points, tempPoint] : measurement.points
    const currentTool = toolType || activeTool
    
    if (pointsToUse.length < 2) return

    // Remove old label
    if (measurement.label && measurementLayerRef.current) {
      measurementLayerRef.current.removeLayer(measurement.label)
      measurement.label = null
    }

    // Calculate measurement
    let distance = 0
    let area = 0
    let labelText = ''

    if (currentTool === 'distance') {
      // Calculate total distance
      for (let i = 0; i < pointsToUse.length - 1; i++) {
        distance += pointsToUse[i].distanceTo(pointsToUse[i + 1])
      }
      
      // Format distance
      if (distance >= 1000) {
        labelText = `${(distance / 1000).toFixed(2)} km`
      } else {
        labelText = `${distance.toFixed(2)} m`
      }
    } else if (currentTool === 'area' && pointsToUse.length >= 3) {
      // Calculate area using spherical geometry
      const coords = pointsToUse.map(p => [p.lat, p.lng])
      // Close the polygon
      if (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1]) {
        coords.push(coords[0])
      }
      
      // Calculate area using spherical excess formula
      area = calculatePolygonArea(coords)
      
      // Format area
      if (area >= 1000000) {
        labelText = `${(area / 1000000).toFixed(2)} km²`
      } else if (area >= 10000) {
        labelText = `${(area / 10000).toFixed(2)} ha`
      } else {
        labelText = `${area.toFixed(2)} m²`
      }
    }

    // Add label at the last point (or temp point)
    if (labelText && pointsToUse.length > 0) {
      const labelPoint = tempPoint || pointsToUse[pointsToUse.length - 1]
      measurement.label = L.marker(labelPoint, {
        icon: L.divIcon({
          className: 'measurement-label',
          html: `<div style="background-color: rgba(59, 130, 246, 0.9); color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.3); pointer-events: none;">${labelText}</div>`,
          iconSize: [null, null],
          iconAnchor: [0, 0]
        }),
        zIndexOffset: 1000,
        interactive: false
      }).addTo(measurementLayerRef.current)
    }
  }, [activeTool, map, calculatePolygonArea])

  const startMeasurement = useCallback((startLatLng) => {
    if (!map || !measurementLayerRef.current) return

    isDrawingRef.current = true
    const points = [startLatLng]
    currentMeasurementRef.current = {
      type: activeTool,
      points: points,
      polyline: null,
      markers: [],
      label: null
    }

    // Create start marker
    const startMarker = L.marker(startLatLng, {
      icon: L.divIcon({
        className: 'measurement-marker',
        html: '<div style="background-color: #3b82f6; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
        iconSize: [12, 12],
        iconAnchor: [6, 6]
      })
    }).addTo(measurementLayerRef.current)

    currentMeasurementRef.current.markers.push(startMarker)
  }, [activeTool, map, updateMeasurement])

  const addPoint = useCallback((latlng) => {
    if (!currentMeasurementRef.current || !measurementLayerRef.current) return

    const measurement = currentMeasurementRef.current
    measurement.points.push(latlng)

    // Remove old polyline/polygon if exists
    if (measurement.polyline) {
      measurementLayerRef.current.removeLayer(measurement.polyline)
    }

    // Create new polyline/polygon
    if (activeTool === 'distance') {
      measurement.polyline = L.polyline(measurement.points, {
        color: '#3b82f6',
        weight: 3,
        opacity: 0.8,
        dashArray: '5, 5'
      }).addTo(measurementLayerRef.current)
    } else if (activeTool === 'area') {
      if (measurement.points.length >= 3) {
        measurement.polyline = L.polygon(measurement.points, {
          color: '#3b82f6',
          weight: 3,
          opacity: 0.8,
          fillColor: '#3b82f6',
          fillOpacity: 0.2,
          dashArray: '5, 5'
        }).addTo(measurementLayerRef.current)
      } else {
        measurement.polyline = L.polyline(measurement.points, {
          color: '#3b82f6',
          weight: 3,
          opacity: 0.8,
          dashArray: '5, 5'
        }).addTo(measurementLayerRef.current)
      }
    }

    // Add point marker
    const marker = L.marker(latlng, {
      icon: L.divIcon({
        className: 'measurement-marker',
        html: '<div style="background-color: #3b82f6; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
        iconSize: [12, 12],
        iconAnchor: [6, 6]
      })
    }).addTo(measurementLayerRef.current)

    measurement.markers.push(marker)
    updateMeasurement()
  }, [activeTool, map, updateMeasurement])

  // Initialize measurement layer
  useEffect(() => {
    if (!map) return

    // Create a layer group for measurements
    const measurementLayer = L.layerGroup().addTo(map)
    measurementLayerRef.current = measurementLayer

    return () => {
      if (measurementLayerRef.current) {
        map.removeLayer(measurementLayerRef.current)
      }
    }
  }, [map])

  // Handle measurement drawing
  useEffect(() => {
    if (!map || !activeTool) {
      // Clean up if tool is deactivated
      if (currentMeasurementRef.current) {
        cleanupMeasurement()
      }
      return
    }

    let tempLine = null
    let tempMarker = null

    const handleMapClick = (e) => {
      e.originalEvent.preventDefault()
      e.originalEvent.stopPropagation()
      
      if (!isDrawingRef.current) {
        startMeasurement(e.latlng)
      } else {
        addPoint(e.latlng)
      }
    }

    const handleMapMove = (e) => {
      if (isDrawingRef.current && currentMeasurementRef.current && currentMeasurementRef.current.points.length > 0) {
        // Remove temporary line/marker
        if (tempLine && measurementLayerRef.current) {
          measurementLayerRef.current.removeLayer(tempLine)
        }
        if (tempMarker && measurementLayerRef.current) {
          measurementLayerRef.current.removeLayer(tempMarker)
        }

        const lastPoint = currentMeasurementRef.current.points[currentMeasurementRef.current.points.length - 1]
        const currentPoint = e.latlng

        // Create temporary line from last point to current mouse position
        if (activeTool === 'distance') {
          tempLine = L.polyline([lastPoint, currentPoint], {
            color: '#3b82f6',
            weight: 2,
            opacity: 0.5,
            dashArray: '3, 3'
          }).addTo(measurementLayerRef.current)
        } else if (activeTool === 'area' && currentMeasurementRef.current.points.length >= 2) {
          const allPoints = [...currentMeasurementRef.current.points, currentPoint]
          tempLine = L.polyline(allPoints, {
            color: '#3b82f6',
            weight: 2,
            opacity: 0.5,
            dashArray: '3, 3'
          }).addTo(measurementLayerRef.current)
        }

        // Update measurement with temporary point
        updateMeasurement(currentPoint)
      }
    }

    map.on('click', handleMapClick)
    map.on('mousemove', handleMapMove)

    // Change cursor
    map.getContainer().style.cursor = 'crosshair'

    return () => {
      map.off('click', handleMapClick)
      map.off('mousemove', handleMapMove)
      map.getContainer().style.cursor = ''
      
      // Clean up temporary elements
      if (tempLine && measurementLayerRef.current) {
        measurementLayerRef.current.removeLayer(tempLine)
      }
      if (tempMarker && measurementLayerRef.current) {
        measurementLayerRef.current.removeLayer(tempMarker)
      }
      
      cleanupMeasurement()
    }
  }, [map, activeTool, updateMeasurement, startMeasurement, addPoint, cleanupMeasurement])

  const finishMeasurement = useCallback(() => {
    if (currentMeasurementRef.current && currentMeasurementRef.current.points.length >= 2) {
      // Finalize the measurement - update the polyline/polygon to be permanent
      const measurement = currentMeasurementRef.current
      const toolType = activeTool
      
      // Remove temporary styling
      if (measurement.polyline && measurementLayerRef.current) {
        measurementLayerRef.current.removeLayer(measurement.polyline)
        
        // Create permanent version
        if (toolType === 'distance') {
          measurement.polyline = L.polyline(measurement.points, {
            color: '#3b82f6',
            weight: 3,
            opacity: 0.9,
            dashArray: '5, 5'
          }).addTo(measurementLayerRef.current)
        } else if (toolType === 'area' && measurement.points.length >= 3) {
          measurement.polyline = L.polygon(measurement.points, {
            color: '#3b82f6',
            weight: 3,
            opacity: 0.9,
            fillColor: '#3b82f6',
            fillOpacity: 0.25,
            dashArray: '5, 5'
          }).addTo(measurementLayerRef.current)
        }
      }
      
      // Update label to be permanent
      updateMeasurement(null, toolType)
      
      // Save measurement
      const newMeasurement = {
        id: Date.now(),
        type: measurement.type,
        points: [...measurement.points],
        polyline: measurement.polyline,
        markers: [...measurement.markers],
        label: measurement.label
      }
      setMeasurements(prev => [...prev, newMeasurement])
    }
    cleanupMeasurement()
    setActiveTool(null)
  }, [activeTool, updateMeasurement, cleanupMeasurement])

  const clearAllMeasurements = () => {
    if (measurementLayerRef.current) {
      measurementLayerRef.current.clearLayers()
    }
    setMeasurements([])
    cleanupMeasurement()
    setActiveTool(null)
  }

  const toggleTool = (tool) => {
    if (activeTool === tool) {
      // Click again to finish current measurement
      if (isDrawingRef.current && currentMeasurementRef.current) {
        finishMeasurement()
      } else {
        setActiveTool(null)
      }
    } else {
      // Clean up current measurement
      if (isDrawingRef.current) {
        cleanupMeasurement()
      }
      setActiveTool(tool)
    }
  }

  // Handle right-click or escape to finish measurement
  useEffect(() => {
    if (!map || !activeTool) return

    const handleContextMenu = (e) => {
      e.originalEvent.preventDefault()
      if (isDrawingRef.current && currentMeasurementRef.current) {
        finishMeasurement()
      }
    }

    const handleKeyPress = (e) => {
      if ((e.key === 'Escape' || e.key === 'Enter') && isDrawingRef.current && currentMeasurementRef.current) {
        e.preventDefault()
        finishMeasurement()
      }
    }

    map.on('contextmenu', handleContextMenu)
    window.addEventListener('keydown', handleKeyPress)

    return () => {
      map.off('contextmenu', handleContextMenu)
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [map, activeTool, finishMeasurement])

  return (
    <div className="absolute top-1/2 right-4 transform -translate-y-1/2 z-[1200] flex flex-col items-center space-y-3" style={{ pointerEvents: 'auto' }}>
      <div className="bg-blue-900 rounded-2xl shadow-2xl overflow-hidden" style={{ borderRadius: '16px 16px 16px 16px' }}>
        {/* Distance Measurement Tool - L-shaped ruler icon */}
        <button
          onClick={() => toggleTool('distance')}
          className={`w-14 h-14 flex items-center justify-center transition-all ${
            activeTool === 'distance'
              ? 'bg-teal-500 text-white'
              : 'bg-blue-900 text-white hover:bg-blue-800'
          }`}
          title="Measure Distance (Click points, Right-click or Enter to finish)"
          style={{ 
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px'
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 21l9-9" />
            <path d="M12 12l9-9" />
            <path d="M3 12h18" />
            <path d="M12 3v18" />
          </svg>
        </button>

        {/* Area Measurement Tool - Square/ruler icon */}
        <button
          onClick={() => toggleTool('area')}
          className={`w-14 h-14 flex items-center justify-center transition-all border-t border-blue-800 ${
            activeTool === 'area'
              ? 'bg-teal-500 text-white'
              : 'bg-blue-900 text-white hover:bg-blue-800'
          }`}
          title="Measure Area (Click points, Right-click or Enter to finish)"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18" />
            <path d="M9 3v18" />
          </svg>
        </button>

        {/* Clear Measurements */}
        {(measurements.length > 0 || isDrawingRef.current) && (
          <button
            onClick={clearAllMeasurements}
            className="w-14 h-14 flex items-center justify-center transition-all border-t border-blue-800 bg-blue-900 text-white hover:bg-red-600"
            title="Clear All Measurements"
            style={{ 
              borderBottomLeftRadius: '16px',
              borderBottomRightRadius: '16px'
            }}
          >
            <FaTimes className="text-base" />
          </button>
        )}
      </div>

      {/* Instructions */}
      {activeTool && (
        <div className="bg-white rounded-lg shadow-lg p-3 text-xs max-w-[220px] border border-gray-200 animate-fade-in">
          <p className="font-semibold text-gray-800 mb-1.5">
            {activeTool === 'distance' ? '📏 Distance Measurement' : '📐 Area Measurement'}
          </p>
          <p className="text-gray-600 mb-1">
            Click on map to add points
          </p>
          <p className="text-gray-500 text-[10px]">
            Right-click or press Enter to finish
          </p>
        </div>
      )}
    </div>
  )
}


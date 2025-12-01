"use client"

import { useEffect, useRef } from "react"
import { useMap } from "react-leaflet"
import L from "leaflet"

export default function WMSOverlay({ layerId, wmsUrl, wmsLayers, wmsFormat = 'image/png', wmsVersion = '1.1.0', opacity = 0.9, attribution }) {
  const map = useMap()
  const wmsLayerRef = useRef(null)

  useEffect(() => {
    if (!wmsUrl || !wmsLayers) {
      return
    }

    // Remove existing layer if it exists
    if (wmsLayerRef.current) {
      map.removeLayer(wmsLayerRef.current)
      wmsLayerRef.current = null
    }

    // Create WMS tile layer
    console.log(`Creating WMS overlay for ${layerId} with URL: ${wmsUrl}, Layers: ${wmsLayers}`)
    
    wmsLayerRef.current = L.tileLayer.wms(wmsUrl, {
      layers: wmsLayers,
      format: wmsFormat,
      version: wmsVersion,
      transparent: true,
      opacity: opacity,
      zIndex: 100,
      attribution: attribution || layerId,
      crs: L.CRS.EPSG3857, // Web Mercator (standard web map projection)
    })

    wmsLayerRef.current.addTo(map)
    console.log(`WMS overlay ${layerId} added to map`)

    return () => {
      if (wmsLayerRef.current) {
        map.removeLayer(wmsLayerRef.current)
        wmsLayerRef.current = null
        console.log(`WMS overlay ${layerId} removed from map`)
      }
    }
  }, [map, layerId, wmsUrl, wmsLayers, wmsFormat, wmsVersion, opacity, attribution])

  // Update opacity when it changes
  useEffect(() => {
    if (wmsLayerRef.current) {
      wmsLayerRef.current.setOpacity(opacity)
    }
  }, [opacity])

  return null
}


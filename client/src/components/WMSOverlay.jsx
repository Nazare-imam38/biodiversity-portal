"use client"

import { useEffect, useRef } from "react"
import { useMap } from "react-leaflet"
import L from "leaflet"

export default function WMSOverlay({ layerId, wmsUrl, wmsLayers, wmsFormat = 'image/png', wmsVersion = '1.1.0', opacity = 0.7, attribution }) {
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

    // Create WMS tile layer using Leaflet's standard WMS implementation
    // Similar to: L.tileLayer.wms(layer.wmsUrl, { layers: layer.wmsLayer, format: 'image/png', transparent: true, opacity: 0.7 })
    const wmsLayer = L.tileLayer.wms(wmsUrl, {
      layers: wmsLayers,
      format: wmsFormat,
      version: wmsVersion,
      transparent: true,
      opacity: opacity,
      zIndex: 100,
      attribution: attribution || layerId,
    })

    // Handle SSL certificate issues by routing HTTPS requests through proxy
    if (wmsUrl.startsWith('https://')) {
      const apiUrl = import.meta.env.VITE_API_URL || ''
      const proxyBaseUrl = apiUrl ? `${apiUrl}/api/wms-proxy` : '/api/wms-proxy'
      
      // Override getTileUrl to use proxy for HTTPS URLs
      const originalGetTileUrl = wmsLayer.getTileUrl.bind(wmsLayer)
      wmsLayer.getTileUrl = function(coords) {
        const originalUrl = originalGetTileUrl(coords)
        if (originalUrl && originalUrl.startsWith('https://')) {
          return `${proxyBaseUrl}?url=${encodeURIComponent(originalUrl)}`
        }
        return originalUrl
      }
    }

    console.log(`Creating WMS overlay for ${layerId} with URL: ${wmsUrl}, Layers: ${wmsLayers}`)
    
    wmsLayerRef.current = wmsLayer
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


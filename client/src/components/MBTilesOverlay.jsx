"use client"

import { useEffect, useRef } from "react"
import { useMap } from "react-leaflet"
import L from "leaflet"

export default function MBTilesOverlay({ layerId, tileUrl, opacity = 0.9, isActive }) {
  const map = useMap()
  const tileLayerRef = useRef(null)

  // Transparent 1x1 PNG for missing tiles
  const transparentPixel =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="

  useEffect(() => {
    if (!isActive) {
      // Remove layer if it's not active
      if (tileLayerRef.current) {
        map.removeLayer(tileLayerRef.current)
        tileLayerRef.current = null
      }
      return
    }

    // Only create layer if it doesn't exist
    if (!tileLayerRef.current && tileUrl) {
      console.log(`Creating MBTiles overlay for ${layerId} with URL: ${tileUrl}`)
      
      tileLayerRef.current = L.tileLayer(tileUrl, {
        minZoom: 0,
        maxZoom: 18,
        opacity: opacity,
        zIndex: 600, // High z-index to show on top of all layers
        attribution: `${layerId} © DHA Marketplace`,
        noWrap: true,
        errorTileUrl: transparentPixel,
        crossOrigin: true,
      })

      tileLayerRef.current.addTo(map)
      console.log(`MBTiles overlay ${layerId} added to map`)
    } else if (tileLayerRef.current) {
      // Update opacity if layer exists
      tileLayerRef.current.setOpacity(opacity)
    }

    return () => {
      if (tileLayerRef.current) {
        map.removeLayer(tileLayerRef.current)
        tileLayerRef.current = null
        console.log(`MBTiles overlay ${layerId} removed from map`)
      }
    }
  }, [map, layerId, tileUrl, opacity, isActive])

  return null
}


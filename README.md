# 🌿 Biodiversity Portal - Pakistan

A modern, interactive GIS web dashboard for visualizing Pakistan's biodiversity data including protected areas, ecoregions, wildlife data, and more.

## 🚀 Features

- **Interactive Map**: Built with Leaflet for smooth, responsive mapping
- **Multiple Layers**: Toggle between different biodiversity datasets
- **Modern UI**: Clean, responsive design with Tailwind CSS
- **Real-time Layer Control**: Enable/disable layers dynamically
- **Feature Popups**: Click on map features to view detailed information
- **Fast Performance**: Optimized with Vite for quick development and builds

## 📊 Available Layers

- Agroecological Zones
- Ecoregions 2017
- Key Biodiversity Areas (KBAs)
- Protected Areas (WDPA)
- Protected Forest Areas
- Ramsar Sites
- Wildlife Protected Areas
- And more...

## 🛠️ Technology Stack

- **Frontend**: React 18 + Vite
- **Mapping**: Leaflet + React-Leaflet
- **Styling**: Tailwind CSS
- **Backend**: Node.js + Express
- **Shapefile Processing**: shapefile npm package

## 📦 Installation

1. **Install dependencies**:
   ```bash
   npm run install:all
   ```

2. **Start the development servers**:
   ```bash
   npm run dev
   ```

   This will start:
   - Backend server on `http://localhost:3001`
   - Frontend development server on `http://localhost:3000`

## 🎯 Usage

1. Open your browser and navigate to `http://localhost:3000`
2. Use the layer panel on the left to toggle different biodiversity layers
3. Click on map features to view detailed information
4. Zoom and pan to explore different regions of Pakistan

## 📁 Project Structure

```
biodiversity-portal/
├── server/
│   └── index.js          # Express backend server
├── client/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── App.jsx       # Main app component
│   │   └── main.jsx      # Entry point
│   └── package.json
├── Baseline Data/        # Shapefile data
└── package.json
```

## 🔧 Configuration

Layer configurations can be modified in `server/index.js` in the `layerConfig` object. Each layer requires:
- `name`: Display name
- `path`: Relative path to the shapefile
- `color`: Hex color for the layer
- `description`: Layer description

## 🌐 API Endpoints

- `GET /api/layers` - Get list of all available layers
- `GET /api/layers/:layerId` - Get GeoJSON data for a specific layer
- `GET /api/health` - Health check endpoint

## 📝 Notes

- Shapefiles are converted to GeoJSON on-the-fly when requested
- Large shapefiles may take a few seconds to load
- The map is centered on Pakistan by default

## 🐛 Troubleshooting

**Backend not starting?**
- Make sure port 3001 is available
- Check that all npm packages are installed

**Layers not loading?**
- Verify shapefile paths in `server/index.js` match your file structure
- Check browser console for errors
- Ensure shapefiles are in the correct format

**Map not displaying?**
- Check that Leaflet CSS is loading
- Verify internet connection (for OpenStreetMap tiles)

## 📄 License

MIT


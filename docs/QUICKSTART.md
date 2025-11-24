# 🚀 Quick Start Guide

## Prerequisites

- **Node.js** (v16 or higher)
- **npm** (comes with Node.js)

## Installation Steps

### 1. Install All Dependencies

```bash
npm run install:all
```

This will install dependencies for both the backend server and frontend client.

### 2. Start the Development Servers

```bash
npm run dev
```

This command starts both:
- **Backend API** on `http://localhost:3001`
- **Frontend App** on `http://localhost:3000`

### 3. Open in Browser

Navigate to: **http://localhost:3000**

## What You'll See

1. **Header**: Biodiversity Portal title and branding
2. **Left Panel**: Layer control panel with toggle switches
3. **Map**: Interactive Leaflet map centered on Pakistan

## Using the Dashboard

### Toggle Layers
- Click the toggle switch next to any layer name in the left panel
- The layer will appear on the map with its designated color
- Toggle off to hide the layer

### Interact with Features
- **Click** on any feature (polygon, point, line) to see a popup with details
- **Hover** over features to see them highlighted
- **Zoom** using mouse wheel or +/- buttons
- **Pan** by clicking and dragging

### Available Layers

- 🌾 Agroecological Zones
- 🌍 Ecoregions 2017
- 🦋 Key Biodiversity Areas
- 🛡️ Protected Areas (WDPA)
- 🌲 Protected Forest
- 🌊 Ramsar Sites
- And more...

## Troubleshooting

### Port Already in Use?

If port 3000 or 3001 is already in use:

1. **Change backend port**: Edit `server/index.js`, change `PORT = 3001` to another port
2. **Change frontend port**: Edit `client/vite.config.js`, change `port: 3000` to another port
3. **Update proxy**: Make sure the proxy in `vite.config.js` matches the backend port

### Layers Not Loading?

1. Check that shapefiles exist in the paths specified in `server/index.js`
2. Verify the backend server is running (check terminal)
3. Open browser DevTools (F12) and check the Console tab for errors
4. Check the Network tab to see if API requests are failing

### Map Not Displaying?

1. Check your internet connection (needed for OpenStreetMap tiles)
2. Verify Leaflet CSS is loading (check browser console)
3. Try refreshing the page

## Development Commands

```bash
# Install all dependencies
npm run install:all

# Start both servers (development)
npm run dev

# Start only backend
npm run dev:server

# Start only frontend
npm run dev:client

# Build for production
npm run build
```

## Next Steps

- Customize layer colors in `server/index.js`
- Add more layers by updating the `layerConfig` object
- Modify UI styling in `client/src/index.css` or component files
- Add new features like search, filters, or statistics

## Need Help?

Check the main `README.md` for more detailed information about the project structure and API endpoints.


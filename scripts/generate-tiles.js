import { exec } from 'child_process';
import { promisify } from 'util';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const execAsync = promisify(exec);

const tiffFiles = [
  {
    name: 'deforestation',
    path: join(__dirname, '..', 'data', 'Deforestation', 'Deforestation_updated_v2.tif'),
    outputDir: join(__dirname, '..', 'tiles', 'deforestation')
  },
  {
    name: 'landcover',
    path: join(__dirname, '..', 'data', 'Landcover Extent', 'GB_LULC_2020_Utm43_Final_Report_v5.tif'),
    outputDir: join(__dirname, '..', 'tiles', 'landcover')
  },
  {
    name: 'restoration',
    path: join(__dirname, '..', 'data', 'Restoration', 'Enhancement_updated.tif'),
    outputDir: join(__dirname, '..', 'tiles', 'restoration')
  }
];

async function generateTiles() {
  console.log('🗺️  Starting tile generation for TIFF files...\n');
  
  // Check if gdal2tiles is available
  try {
    await execAsync('gdal2tiles.py --version');
    console.log('✅ GDAL2Tiles found\n');
  } catch (error) {
    console.error('❌ GDAL2Tiles not found!');
    console.error('Please install GDAL:');
    console.error('  Windows: Download from https://gdal.org/download.html');
    console.error('  Mac: brew install gdal');
    console.error('  Linux: sudo apt-get install gdal-bin');
    process.exit(1);
  }
  
  for (const tiff of tiffFiles) {
    try {
      // Check if input file exists
      if (!existsSync(tiff.path)) {
        console.error(`❌ Input file not found: ${tiff.path}`);
        continue;
      }
      
      // Create output directory if it doesn't exist
      if (!existsSync(tiff.outputDir)) {
        mkdirSync(tiff.outputDir, { recursive: true });
      }
      
      console.log(`📦 Generating tiles for ${tiff.name}...`);
      console.log(`   Input: ${tiff.path}`);
      console.log(`   Output: ${tiff.outputDir}`);
      
      // Generate tiles (zoom levels 0-12, Web Mercator projection)
      const command = `gdal2tiles.py -z 0-12 -p mercator "${tiff.path}" "${tiff.outputDir}"`;
      
      console.log(`   Running: ${command}\n`);
      const { stdout, stderr } = await execAsync(command);
      
      if (stdout) console.log(stdout);
      if (stderr && !stderr.includes('Warning')) console.error(stderr);
      
      console.log(`✅ Tiles generated successfully for ${tiff.name}\n`);
      
    } catch (error) {
      console.error(`❌ Error generating tiles for ${tiff.name}:`, error.message);
      if (error.stderr) console.error('   Error details:', error.stderr);
      console.log('');
    }
  }
  
  console.log('🎉 Tile generation complete!');
  console.log('\nNext steps:');
  console.log('1. Tiles are now in the tiles/ directory');
  console.log('2. The server will automatically serve them from /tiles/');
  console.log('3. Add tile layers to the map in MapView.jsx');
}

generateTiles();


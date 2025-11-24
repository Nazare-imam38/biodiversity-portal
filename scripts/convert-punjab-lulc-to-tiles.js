import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync, unlinkSync } from 'fs';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Paths
const tifPath = join(__dirname, '..', 'Assets', 'Punjab', 'Punjab lulc.tif');
const outputDir = join(__dirname, '..', 'tiles', 'punjab-lulc');

// GDAL paths (QGIS installation)
const GDAL_BIN = 'C:\\Program Files\\QGIS 3.44.1\\bin';
const GDAL2TILES = 'C:\\Program Files\\QGIS 3.44.1\\apps\\Python312\\Scripts\\gdal2tiles-script.py';
const PYTHON = 'C:\\Program Files\\QGIS 3.44.1\\apps\\Python312\\python.exe'; // Use QGIS Python

async function convertTiffToTiles() {
  try {
    console.log('Starting Punjab LULC TIFF to Tiles conversion...\n');
    
    // Check if input file exists
    if (!existsSync(tifPath)) {
      throw new Error(`Input file not found: ${tifPath}`);
    }
    
    console.log(`Input file: ${tifPath}`);
    console.log(`Output directory: ${outputDir}\n`);
    
    // Create output directory
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
      console.log(`Created output directory: ${outputDir}`);
    }
    
    // Set environment variables for GDAL
    const env = {
      ...process.env,
      PATH: `${GDAL_BIN};${process.env.PATH}`,
      GDAL_DATA: 'C:\\Program Files\\QGIS 3.44.1\\share\\gdal',
      PROJ_LIB: 'C:\\Program Files\\QGIS 3.44.1\\share\\proj'
    };
    
    // Step 1: Convert TIFF to 8-bit VRT (required for gdal2tiles)
    const vrtPath = join(__dirname, '..', 'tiles', 'punjab-lulc-temp.vrt');
    const gdalTranslate = join(GDAL_BIN, 'gdal_translate.exe');
    
    console.log('Step 1: Converting TIFF to 8-bit VRT...');
    const translateCommand = `"${gdalTranslate}" -of VRT -ot Byte -scale "${tifPath}" "${vrtPath}"`;
    console.log(`Command: ${translateCommand}\n`);
    
    const { stdout: translateStdout, stderr: translateStderr } = await execAsync(translateCommand, {
      env,
      maxBuffer: 1024 * 1024 * 10
    });
    
    if (translateStdout) console.log(translateStdout);
    if (translateStderr && !translateStderr.includes('Warning')) {
      console.error('Warnings:', translateStderr);
    }
    
    console.log('✅ VRT conversion complete!\n');
    
    // Step 2: Convert VRT to tiles
    // Options:
    // -z: zoom levels (0-12 for reasonable file size, adjust as needed)
    // -p: profile (raster for raster tiles)
    // -w: web viewer (none to skip HTML generation)
    // -s: spatial reference system (EPSG:3857 for Web Mercator)
    const tilesCommand = `"${PYTHON}" "${GDAL2TILES}" -z 0-12 -p raster -w none -s EPSG:3857 "${vrtPath}" "${outputDir}"`;
    
    console.log('Step 2: Converting VRT to tiles...');
    console.log('This may take 15-30 minutes for a large file. Please be patient...');
    console.log(`Command: ${tilesCommand}\n`);
    
    // Use spawn for better progress handling and larger buffer
    const pythonProcess = spawn(PYTHON, [
      GDAL2TILES,
      '-z', '0-12',
      '-p', 'raster',
      '-w', 'none',
      '-s', 'EPSG:3857',
      vrtPath,
      outputDir
    ], {
      env,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    let tilesStdout = '';
    let tilesStderr = '';
    
    pythonProcess.stdout.on('data', (data) => {
      const output = data.toString();
      tilesStdout += output;
      // Show progress updates
      if (output.includes('Processing') || output.includes('tile') || output.includes('zoom')) {
        process.stdout.write(output);
      }
    });
    
    pythonProcess.stderr.on('data', (data) => {
      const output = data.toString();
      tilesStderr += output;
      // Show warnings/errors
      if (!output.includes('Warning')) {
        process.stderr.write(output);
      }
    });
    
    await new Promise((resolve, reject) => {
      pythonProcess.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Process exited with code ${code}`));
        }
      });
      
      pythonProcess.on('error', (error) => {
        reject(error);
      });
    });
    
    if (tilesStdout) console.log(tilesStdout);
    if (tilesStderr && !tilesStderr.includes('Warning')) {
      console.error('Warnings:', tilesStderr);
    }
    
    // Clean up temporary VRT file
    if (existsSync(vrtPath)) {
      unlinkSync(vrtPath);
      console.log('Cleaned up temporary VRT file');
    }
    
    console.log('\n✅ Successfully converted TIFF to tiles!');
    console.log(`Tiles saved to: ${outputDir}`);
    
  } catch (error) {
    console.error('\n❌ Error converting TIFF to tiles:', error.message);
    if (error.stdout) console.error('STDOUT:', error.stdout);
    if (error.stderr) console.error('STDERR:', error.stderr);
    process.exit(1);
  }
}

convertTiffToTiles();


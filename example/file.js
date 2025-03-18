import * as geonames from '../index.js';
import fs from 'fs';
import path from 'path';
import { Transform } from 'node:stream';
import { fileURLToPath } from 'url';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the NZ.zip file in the example directory
const zipFile = path.join(__dirname, 'NZ.zip');
const inputStream = fs.createReadStream(zipFile);

// Set up error handling
inputStream.on('error', (err) => {
  console.error('Input stream error:', err);
  process.exit(1);
});

// Create a formatter for nicer output
const formatter = new Transform({
  objectMode: true,
  transform(data, enc, callback) {
    // Format the output more concisely
    const output = {
      id: data._id,
      name: data.name,
      location: `${data.latitude},${data.longitude}`,
      country: data.country_code,
      feature: `${data.feature_class}/${data.feature_code}`,
      timezone: data.timezone
    };

    this.push(JSON.stringify(output, null, 2) + '\n\n');
    callback();
  }
});

// Process the input stream through the pipeline
const pipeline = geonames.createPipeline(inputStream);

pipeline
  .on('error', (err) => {
    console.error('Pipeline error:', err);
    process.exit(1);
  })
  .pipe(formatter)
  .on('error', (err) => {
    console.error('Formatter error:', err);
    process.exit(1);
  })
  .pipe(process.stdout)
  .on('error', (err) => {
    // Ignore EPIPE errors (when piped to head, etc.)
    if (err && 'code' in err && err.code === 'EPIPE') {
      // Gracefully handle the broken pipe
      return;
    }
    console.error('Output error:', err);
    process.exit(1);
  });

process.on('uncaughtException', (err) => {
  // Also ignore EPIPE errors at the process level
  if (err && 'code' in err && err.code === 'EPIPE') {
    // Gracefully handle the broken pipe
    return;
  }
  console.error('Uncaught exception:', err);
  process.exit(1);
});

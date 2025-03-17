// This should run without causing memory leaks
// You can test this by watching the memory usage with 'top'

// Update the path to your geonames ZIP file
const filename = './example/NZ.zip';

import * as geonames from '../index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Memory usage example for ZIP file processing
 * Shows how to efficiently process a zipped geonames file
 */
console.log('Initial memory usage:', process.memoryUsage().heapUsed / 1024 / 1024, 'MB');

const dataStream = fs.createReadStream(`${__dirname}/NZ.zip`);
const pipeline = geonames.createPipeline(dataStream);

let count = 0;
pipeline.on('data', () => {
  count++;
  if (count % 1000 === 0) {
    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    console.log(`Records processed: ${count}, Memory usage: ${Math.round(used * 100) / 100} MB`);
  }
});

pipeline.on('end', () => {
  console.log('Total records:', count);
  console.log('Final memory usage:', process.memoryUsage().heapUsed / 1024 / 1024, 'MB');
});

pipeline.on('error', (err) => {
  console.error('Error:', err);
});

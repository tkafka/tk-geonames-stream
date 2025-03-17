import through from 'through2';
import { stringify } from './lib/stringify.js';
import { parser } from './lib/tsvparser.js';
import { unzip } from './lib/unzip.js';
import split from 'split';
import { PassThrough } from 'stream';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { alternativeNames } from './lib/alternative_names.js';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load schema
const schemaPath = path.join(__dirname, 'schema.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

// Create a function that builds a pipeline
const createPipeline = (source) => {
  // Get the geoname schema as default
  const geonameSchema = schema.geoname;

  const unzipper = unzip();
  const splitter = split();
  const tsvParser = parser(geonameSchema);
  
  // Create a single transform stream that combines parsing and modification
  // to reduce the number of stream transformations
  const parserAndModifier = through.obj(function(chunk, enc, next) {
    // First parse the TSV
    const parsed = {};
    const cells = chunk.toString('utf-8').split('\t');
    const columnsLength = geonameSchema.length;
    
    // Fast TSV parsing
    const cellsLength = Math.min(cells.length, columnsLength);
    for (let i = 0; i < cellsLength; i++) {
      const cell = cells[i] || '';
      parsed[geonameSchema[i]] = cell ? cell.trim() : '';
    }
    
    // Then handle alternative names
    if (typeof parsed.alternatenames === 'string' && parsed.alternatenames.length > 0) {
      const names = parsed.alternatenames.split(',');
      const filtered = [];
      for (let i = 0; i < names.length; i++) {
        if (names[i]) filtered.push(names[i]);
      }
      parsed.alternatenames = filtered;
    } else {
      parsed.alternatenames = [];
    }
    
    this.push(parsed);
    next();
  });

  // Pipe the source into the unzipper
  if (source) {
    source.pipe(unzipper);
  }

  // Create a combined pipeline or use the original pipeline based on an environment flag
  const useOptimizedPipeline = process.env.USE_OPTIMIZED_PIPELINE !== 'false';
  
  if (useOptimizedPipeline) {
    // Optimized pipeline with fewer stream transformations
    return unzipper.pipe(splitter).pipe(parserAndModifier);
  } else {
    // Original pipeline for backward compatibility
    const modifier = through.obj(alternativeNames);
    return unzipper.pipe(splitter).pipe(tsvParser).pipe(modifier);
  }
};

// Create a transform stream that can be used as a pipeline
// This maintains backward compatibility with tests
/** @type {any} */
const pipelineStream = through.obj(function (chunk, enc, next) {
  this.push(chunk);
  next();
});

// Add a pipeline method to the stream for new API usage
pipelineStream.pipelineMethod = createPipeline;

// Function to create a modifier stream
const modifiers = () => through.obj(alternativeNames);

// Export the module components and utilities
export { unzip, parser, stringify, modifiers, pipelineStream as pipeline, createPipeline };

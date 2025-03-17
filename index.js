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

// Define batch size for processing - adjust based on your data characteristics
const DEFAULT_BATCH_SIZE = process.env.GEONAMES_BATCH_SIZE ? 
  parseInt(process.env.GEONAMES_BATCH_SIZE, 10) : 1000;

// Flag to determine if we should use the optimized pipeline
const useOptimizedPipeline = process.env.USE_OPTIMIZED_PIPELINE !== 'false';

// Create a function that builds a pipeline
const createPipeline = (source, options = {}) => {
  // Get the geoname schema as default
  const geonameSchema = schema.geoname;
  
  // Extract options with defaults
  const batchSize = options.batchSize || DEFAULT_BATCH_SIZE;
  const useBatching = options.useBatching !== false && batchSize > 1;

  const unzipper = unzip();
  const splitter = split();
  
  // Helper function to create a simple pre-allocated object with geonameSchema keys
  const createEmptyRecord = () => {
    const obj = {};
    for (let i = 0; i < geonameSchema.length; i++) {
      obj[geonameSchema[i]] = '';
    }
    return obj;
  };
  
  // Create an ultra-optimized stream with batching support for maximum performance
  const optimizedParserAndModifier = through.obj(function(chunk, enc, next) {
    if (!chunk) return next();
    
    const line = chunk.toString('utf-8');
    if (!line.trim()) return next(); // Skip empty lines
    
    // Parse TSV extremely efficiently
    const cells = line.split('\t');
    const parsed = createEmptyRecord(); // Use pre-allocated object
    
    // Fast TSV parsing with direct property assignment
    const cellsLength = Math.min(cells.length, geonameSchema.length);
    for (let i = 0; i < cellsLength; i++) {
      if (cells[i]) {
        parsed[geonameSchema[i]] = cells[i].trim();
      }
    }
    
    // Handle alternateNames with the most optimized algorithm
    if (typeof parsed.alternatenames === 'string') {
      if (parsed.alternatenames.length === 0) {
        parsed.alternatenames = [];
      } else if (parsed.alternatenames.indexOf(',') === -1) {
        // Single name without commas
        parsed.alternatenames = [parsed.alternatenames];
      } else {
        // Multiple names with commas
        const names = parsed.alternatenames.split(',');
        const len = names.length;
        
        // Preallocate array
        const filtered = new Array(len);
        let count = 0;
        
        // Unrolled loop for performance
        let i = 0;
        for (; i + 3 < len; i += 4) {
          if (names[i]) filtered[count++] = names[i];
          if (names[i+1]) filtered[count++] = names[i+1];
          if (names[i+2]) filtered[count++] = names[i+2];
          if (names[i+3]) filtered[count++] = names[i+3];
        }
        
        // Handle remaining items
        for (; i < len; i++) {
          if (names[i]) filtered[count++] = names[i];
        }
        
        // Trim array to actual size
        if (count < len) {
          filtered.length = count;
        }
        
        parsed.alternatenames = filtered;
      }
    } else {
      parsed.alternatenames = [];
    }
    
    this.push(parsed);
    next();
  });
  
  // Create a batched version of the parser for even better performance
  // This reduces the number of function calls and stream operations
  const batchedParserAndModifier = through.obj(function(chunk, enc, next) {
    if (!chunk) return next();
    
    const lines = chunk.toString('utf-8').split('\n');
    const results = [];
    
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      if (!line.trim()) continue;
      
      const cells = line.split('\t');
      const parsed = createEmptyRecord();
      
      const cellsLength = Math.min(cells.length, geonameSchema.length);
      for (let i = 0; i < cellsLength; i++) {
        if (cells[i]) {
          parsed[geonameSchema[i]] = cells[i].trim();
        }
      }
      
      // Handle alternateNames
      if (typeof parsed.alternatenames === 'string') {
        if (parsed.alternatenames.length === 0) {
          parsed.alternatenames = [];
        } else if (parsed.alternatenames.indexOf(',') === -1) {
          parsed.alternatenames = [parsed.alternatenames];
        } else {
          const names = parsed.alternatenames.split(',');
          const filtered = new Array(names.length);
          let count = 0;
          
          for (let i = 0; i < names.length; i++) {
            if (names[i]) filtered[count++] = names[i];
          }
          
          if (count < names.length) {
            filtered.length = count;
          }
          
          parsed.alternatenames = filtered;
        }
      } else {
        parsed.alternatenames = [];
      }
      
      results.push(parsed);
    }
    
    // Push all results at once
    for (let i = 0; i < results.length; i++) {
      this.push(results[i]);
    }
    
    next();
  });
  
  // Pipe the source into the unzipper
  if (source) {
    source.pipe(unzipper);
  }

  // Create a combined pipeline based on configuration options
  if (useOptimizedPipeline) {
    if (useBatching) {
      // Create a custom splitter that produces batches of lines
      const batchSplitter = through.obj(function(chunk, enc, next) {
        if (!chunk) return next();
        
        const data = chunk.toString('utf-8');
        const lines = data.split('\n');
        
        // Process in batches for efficiency
        for (let i = 0; i < lines.length; i += batchSize) {
          const batch = lines.slice(i, i + batchSize).join('\n');
          if (batch.trim()) {
            this.push(batch);
          }
        }
        
        next();
      });
      
      // Optimized batched pipeline
      return unzipper.pipe(batchSplitter).pipe(batchedParserAndModifier);
    } else {
      // Optimized pipeline with single record processing
      return unzipper.pipe(splitter).pipe(optimizedParserAndModifier);
    }
  } else {
    // Original pipeline for backward compatibility
    const tsvParser = parser(geonameSchema);
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

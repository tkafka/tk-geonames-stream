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
  const modifier = through.obj(alternativeNames);

  // Pipe the source into the unzipper
  if (source) {
    source.pipe(unzipper);
  }

  // Create the remainder of the pipeline
  return unzipper.pipe(splitter).pipe(tsvParser).pipe(modifier);
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

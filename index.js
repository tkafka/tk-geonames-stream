const through = require('through2');
const stringify = require('./lib/stringify');
const parser = require('./lib/tsvparser');
const unzip = require('./lib/unzip');
const split = require('split');
const { PassThrough } = require('stream');

// Create a function that builds a pipeline
const createPipeline = (source) => {
  // Get the geoname schema as default
  const schema = require('./schema.json').geoname;

  const unzipper = unzip();
  const splitter = split();
  const tsvParser = parser(schema);
  const modifier = through.obj(require('./lib/alternative_names'));

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

// Export the module components and utilities
module.exports = {
  // Individual stream components
  unzip,
  parser,
  stringify,

  // Stream for processing alternative names
  modifiers: () => through.obj(require('./lib/alternative_names')),

  // For backward compatibility we provide a stream object
  // with a method to create a pipeline
  pipeline: pipelineStream
};

// Also provide the function version for modern usage
module.exports.createPipeline = createPipeline;

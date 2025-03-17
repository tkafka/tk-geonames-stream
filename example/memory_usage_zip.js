// This should run without causing memory leaks
// You can test this by watching the memory usage with 'top'

// Update the path to your geonames ZIP file
const filename = './example/NZ.zip';

const through = require('through2');
const geonames = require('../index');
const fs = require('fs');

const counts = {};
const countStream = function(key, showIds) {
  return through.obj(function(item, enc, next) {
    if (!counts.hasOwnProperty(key)) { counts[key] = 0; }
    ++counts[key];
    console.log('counts', counts);
    this.push(item);
    next();
  });
};

// Create a readable stream from the file
const readStream = fs.createReadStream(filename);

// Process through the pipeline
readStream
  .pipe(countStream('a'))
  .pipe(geonames.createPipeline(readStream)) // Use the new createPipeline function
  .pipe(countStream('d'))
  .pipe(through.obj(function(item, enc, next) { next(); })); // null
const schema = require('../schema.json');
const through = require('through2');

const defaultSchema = schema.geoname;

/**
 * Creates a transform stream that parses TSV data into objects
 * @param {string|Array} customSchema Custom schema Array or name of the existing in schema.json
 * @returns {Object} A transform stream for processing TSV data
 */
function factory(customSchema) {
  customSchema = customSchema || defaultSchema;

  let columns;

  switch(typeof customSchema) {
    case 'string':
      columns = schema[customSchema];
      break;
    case 'object':
      if (Array.isArray(customSchema)) {
        columns = customSchema;
      } else {
        throw new TypeError('customSchema must be a string or an array');
      }
      break;
    default:
      throw new TypeError('customSchema must be a string or an array');
  }

  return through.obj(function(chunk, enc, next) {
    const row = {};
    const cells = chunk.toString('utf-8').split('\t');
    
    cells.forEach(function(cell, i) {
      if (i < columns.length) {
        row[columns[i]] = (cell || '').trim();
      }
    });
    
    if (chunk) {
      this.push(row);
    }
    
    next();
  });
}

module.exports = factory;
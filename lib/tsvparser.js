import through from 'through2';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load schema
const schemaPath = path.join(__dirname, '..', 'schema.json');
const schemaData = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

const defaultSchema = schemaData.geoname;

/**
 * Creates a transform stream that parses TSV data into objects
 * @param {string|Array} customSchema Custom schema Array or name of the existing in schema.json
 * @returns {Object} A transform stream for processing TSV data
 */
export function parser(customSchema) {
  const schema = customSchema || defaultSchema;

  let columns;

  switch (typeof schema) {
    case 'string':
      columns = schema[schema];
      break;
    case 'object':
      if (Array.isArray(schema)) {
        columns = schema;
      } else {
        throw new TypeError('customSchema must be a string or an array');
      }
      break;
    default:
      throw new TypeError('customSchema must be a string or an array');
  }

  return through.obj(function (chunk, enc, next) {
    const row = {};
    const cells = chunk.toString('utf-8').split('\t');

    cells.forEach((cell, i) => {
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

import { Transform } from 'node:stream';
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

  // Pre-calculate the columns length for performance
  const columnsLength = columns.length;

  return new Transform({
    objectMode: true,
    transform(chunk, enc, callback) {
      if (!chunk) {
        return callback();
      }
  
      const row = {};
      const cells = chunk.toString('utf-8').split('\t');
      
      // Optimized loop with fixed length and no redundant checks
      const cellsLength = Math.min(cells.length, columnsLength);
      for (let i = 0; i < cellsLength; i++) {
        const cell = cells[i] || '';
        if (cell) {
          row[columns[i]] = cell.trim();
        } else {
          row[columns[i]] = '';
        }
      }
  
      this.push(row);
      callback();
    }
  });
}

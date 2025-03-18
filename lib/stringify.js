import { Transform } from 'node:stream';

/**
 * Convenience function for converting object streams back to strings
 * Creates a transform stream that stringifies objects to JSON
 */
export const stringify = new Transform({
  objectMode: true,
  transform(data, enc, callback) {
    this.push(JSON.stringify(data, null, 2), 'utf-8');
    callback();
  }
});

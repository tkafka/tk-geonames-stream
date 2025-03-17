import through from 'through2';

/**
 * Convenience function for converting object streams back to strings
 * Creates a transform stream that stringifies objects to JSON
 */
export const stringify = through.obj(function (data, enc, next) {
  this.push(JSON.stringify(data, null, 2), 'utf-8');
  next();
});

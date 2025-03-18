/**
 * Converts alternative_names from comma-separated string to an array
 * @param {Object} data The data object to process
 * @param {string} enc Encoding
 * @param {Function} next Callback to continue the stream processing
 */
export function alternativeNames(data, enc, next) {
  // Fast path: if alternatenames is a string, split once and filter in one pass
  if (typeof data.alternatenames === 'string' && data.alternatenames.length > 0) {
    // Using split and filter in a single pass
    const names = data.alternatenames.split(',');
    const filtered = [];
    for (let i = 0; i < names.length; i++) {
      if (names[i]) filtered.push(names[i]);
    }
    data.alternatenames = filtered;
  } else {
    // Ensure alternatenames is always an array
    data.alternatenames = [];
  }

  // forward down the pipe
  this.push(data);
  next();
}

/**
 * Validates a value exists
 * @param {string} val The value to check
 * @returns {boolean} True if the value exists
 */
function valid(val) {
  return Boolean(val);
}

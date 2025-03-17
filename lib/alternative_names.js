/**
 * Converts alternative_names from comma-separated string to an array
 * @param {Object} data The data object to process
 * @param {string} enc Encoding
 * @param {Function} next Callback to continue the stream processing
 */
export function alternativeNames(data, enc, next) {
  if (typeof data.alternatenames === 'string') {
    data.alternatenames = data.alternatenames.split(',').filter(valid);
  } else {
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

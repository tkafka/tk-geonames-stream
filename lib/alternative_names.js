/**
 * Converts alternative_names from comma-separated string to an array
 * @param {Object} data The data object to process
 * @param {string} enc Encoding
 * @param {Function} next Callback to continue the stream processing
 */
export function alternativeNames(data, enc, next) {
  // Ultra fast path for the most common case
  if (typeof data.alternatenames === 'string') {
    if (data.alternatenames.length === 0) {
      data.alternatenames = [];
    } else if (data.alternatenames.indexOf(',') === -1) {
      // Single name without commas
      data.alternatenames = [data.alternatenames];
    } else {
      // Multiple names with commas - use a fast split implementation
      const names = data.alternatenames.split(',');
      // Preallocate array to avoid resizing
      const filtered = new Array(names.length);
      let count = 0;
      
      // Unrolled loop for better performance when possible
      const len = names.length;
      let i = 0;
      
      // Process groups of 4 for loop unrolling when possible
      for (; i + 3 < len; i += 4) {
        if (names[i]) filtered[count++] = names[i];
        if (names[i+1]) filtered[count++] = names[i+1];
        if (names[i+2]) filtered[count++] = names[i+2];
        if (names[i+3]) filtered[count++] = names[i+3];
      }
      
      // Handle remaining items
      for (; i < len; i++) {
        if (names[i]) filtered[count++] = names[i];
      }
      
      // Trim array to actual size if needed
      if (count < names.length) {
        filtered.length = count;
      }
      
      data.alternatenames = filtered;
    }
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

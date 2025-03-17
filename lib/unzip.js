// stream unzip files
const unzip = require('unzipper');
const { PassThrough } = require('readable-stream');
const through = require('through2');

/**
 * Creates a stream that unzips the input stream
 * @returns {Object} A duplex stream that handles unzipping
 */
module.exports = function() {
  // Create a writable stream that processes zip entries
  let activeEntries = 0;
  let streamClosed = false;
  
  // Create a pass-through stream for output
  const outputStream = new PassThrough();
  
  // Create a transform stream to handle the input zip data
  const transform = through(function(chunk, enc, callback) {
    try {
      // Forward the chunks to the parser
      parser.write(chunk, enc);
    } catch (err) {
      outputStream.emit('error', err);
    }
    callback();
  }, function(callback) {
    // Flush function - signal parser that input is done
    parser.end();
    callback();
  });
  
  const parser = unzip.Parse();
  
  parser
    .on('error', function(err) {
      console.error('Unzip parser error:', err);
      if (!outputStream.destroyed) {
        outputStream.emit('error', err);
      }
    })
    .on('entry', function(entry) {
      // skip readme files
      if (entry.props.path.match('readme')) {
        return entry.autodrain();
      }
      
      // Track active entries
      activeEntries++;
      
      // Process entry data
      entry.pipe(outputStream, { end: false });
      
      entry.on('end', function() {
        activeEntries--;
        // End the output stream only when all entries are processed
        // and the parser has ended
        if (activeEntries === 0 && streamClosed) {
          outputStream.end();
        }
      });
      
      entry.on('error', function(err) {
        console.error('Entry error:', err);
        if (!outputStream.destroyed) {
          outputStream.emit('error', err);
        }
      });
    })
    .on('end', function() {
      streamClosed = true;
      if (activeEntries === 0) {
        outputStream.end();
      }
    });
  
  // Connect the streams
  transform.pipe(parser, { end: true });
  
  // Create a duplex wrapper stream
  const unzipStream = through(
    function(chunk, enc, callback) {
      transform.write(chunk, enc, callback);
    },
    function(callback) {
      transform.end();
      callback();
    }
  );
  
  // When piping to the unzipStream, pipe its output stream instead
  const originalPipe = unzipStream.pipe;
  unzipStream.pipe = function(dest, options) {
    return outputStream.pipe(dest, options);
  };
  
  return unzipStream;
};

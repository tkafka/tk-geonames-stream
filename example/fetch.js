const geonames = require('../');
const { Readable } = require('stream');
const through = require('through2');

/**
 * Create a formatter for nicer output
 */
const formatter = through.obj(function (data, enc, next) {
  // Format the output more concisely
  const output = {
    id: data._id,
    name: data.name,
    location: `${data.latitude},${data.longitude}`,
    country: data.country_code,
    feature: `${data.feature_class}/${data.feature_code}`,
    timezone: data.timezone
  };

  this.push(JSON.stringify(output, null, 2) + '\n\n');
  next();
});

/**
 * Fetches and processes geonames data from a URL using streaming
 * This maintains true streaming without loading the entire file into memory
 */
async function fetchAndProcess() {
  try {
    console.error('Fetching geonames data from remote server...');

    // Initiate the request - this doesn't download the full file yet
    const response = await fetch(
      'http://download.geonames.org/export/dump/NZ.zip'
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch: ${response.status} ${response.statusText}`
      );
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    // Convert the web stream to a Node.js stream - this maintains streaming behavior
    const bodyStream = Readable.fromWeb(response.body);

    console.error('Processing data...');

    // Process the data through our pipeline
    const pipeline = geonames.createPipeline(bodyStream);

    pipeline
      .on('error', (err) => {
        console.error('Pipeline error:', err);
        process.exit(1);
      })
      .pipe(formatter)
      .on('error', (err) => {
        console.error('Formatter error:', err);
        process.exit(1);
      })
      .pipe(process.stdout)
      .on('error', (err) => {
        // Ignore EPIPE errors (when piped to head, etc.)
        if (err && err.code === 'EPIPE') return;
        console.error('Output error:', err);
        process.exit(1);
      });
  } catch (error) {
    console.error('Error fetching data:', error);
    process.exit(1);
  }
}

// Start the fetch and process operation
fetchAndProcess();

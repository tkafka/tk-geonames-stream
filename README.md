# tk-geonames-stream

An updated fork of [geonames-stream](https://github.com/geopipes/geonames-stream) with modern Node.js support. The updates were mostly done automatically with Claude 3.7 Sonnet.

## Installation

```bash
$ npm install tk-geonames-stream
```

[![NPM](https://nodei.co/npm/tk-geonames-stream.png?downloads=true&stars=true)](https://nodei.co/npm/tk-geonames-stream)

Note: you will need `node` and `npm` installed first.

This package requires Node.js version 18 or newer for `fetch` support.

## Usage

You can extract the geonames on-the-fly while you're still downloading the file:

```javascript
const geonames = require('tk-geonames-stream');
const { Readable } = require('stream');

async function fetchAndProcess() {
  // Fetch data with streaming support
  const response = await fetch('http://download.geonames.org/export/dump/NZ.zip');
  
  // Convert the response to a Node.js stream
  const bodyStream = Readable.fromWeb(response.body);
  
  // Process through our pipeline
  geonames.pipeline(bodyStream)
    .pipe(geonames.stringify())
    .pipe(process.stdout);
}

fetchAndProcess();
```

Or you can go old-school and work with files on disk:

```javascript
const geonames = require('tk-geonames-stream');
const fs = require('fs');

// wget http://download.geonames.org/export/dump/NZ.zip
fs.createReadStream('NZ.zip')
  .pipe(geonames.pipeline())
  .pipe(geonames.stringify())
  .pipe(process.stdout);
```

## Roll your own

The easiest way to get started writing your own pipes is to use `through2`; just make sure you call `next()`.

```javascript
const geonames = require('tk-geonames-stream');
const { Readable } = require('stream');
const through = require('through2');

async function fetchAndProcess() {
  const response = await fetch('http://download.geonames.org/export/dump/NZ.zip');
  const bodyStream = Readable.fromWeb(response.body);
  
  geonames.pipeline(bodyStream)
    .pipe(through.obj(function(data, enc, next) {
      console.log(data._id, data.name, data.population);
      next();
    }));
}

fetchAndProcess();
```

Output will look something like:
```
2189529 Invercargill 47287
2189530 Invercargill 0
2189531 Inveagh Bay 0
2189532 Inumia Stream 0
```

## Schema

The streams output objects which look like this:

```javascript
{
  "_id": "2179348",
  "name": "Whananaki",
  "asciiname": "Whananaki",
  "alternatenames": [],
  "latitude": "-35.5",
  "longitude": "174.45",
  "feature_class": "P",
  "feature_code": "PPL",
  "country_code": "NZ",
  "cc2": "",
  "admin1_code": "F6",
  "admin2_code": "002",
  "admin3_code": "",
  "admin4_code": "",
  "population": "0",
  "elevation": "",
  "dem": "59",
  "timezone": "Pacific/Auckland",
  "modification_date": "2011-08-01"
}
```

## The generic pipeline

The module provides a streamlined way to create a processing pipeline:

```javascript
const geonames = require('tk-geonames-stream');

// Create a pipeline with a source stream
const pipeline = geonames.createPipeline(sourceStream);

// Or use the individual components
const { unzip, split, parser, modifiers } = require('tk-geonames-stream');
const myPipeline = unzip()
  .pipe(split())
  .pipe(parser())
  .pipe(modifiers());
```

If you need more control, you can re-wire things as you wish; say.. maybe you didn't want the unzip step?

```javascript
const geonames = require('tk-geonames-stream');
const { Readable } = require('stream');
const split = require('split');

async function fetchAndProcess() {
  const response = await fetch('http://example.com/example.tsv');
  const bodyStream = Readable.fromWeb(response.body);
  
  bodyStream
    // .pipe(geonames.unzip()) // I don't want the unzip step
    .pipe(split())
    .pipe(geonames.parser())
    .pipe(geonames.modifiers())
    .pipe(geonames.stringify())
    .pipe(process.stdout);
}

fetchAndProcess();
```

## NPM Module

The `tk-geonames-stream` npm module can be found here:

[https://npmjs.org/package/tk-geonames-stream](https://npmjs.org/package/tk-geonames-stream)

## Contributing

Please fork and pull request against upstream master on a feature branch.

Pretty please; provide unit tests and script fixtures in the `test` directory.

### Running Unit Tests

```bash
$ npm test
```

### Continuous Integration

This project uses modern Node.js versions (18+) for development and testing.

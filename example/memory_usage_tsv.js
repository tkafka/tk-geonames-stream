// This should run without causing memory leaks
// You can test this by watching the memory usage with 'top'

// Update the path to your geonames TSV file
const filename = './example/NZ.zip';

const through = require('through2');
const geonames = require('../index');
const fs = require('fs');

const counts = {};
const countStream = (key, showIds) =>
  through.obj(function (item, enc, next) {
    if (!counts.hasOwnProperty(key)) {
      counts[key] = 0;
    }
    ++counts[key];
    console.log('counts', counts);
    this.push(item);
    next();
  });

// Get the geoname schema as default
const schema = require('../schema.json').geoname;

fs.createReadStream(filename, { encoding: 'utf8' })
  .pipe(countStream('a'))
  .pipe(geonames.parser(schema))
  .pipe(countStream('d'))
  .pipe(
    through.obj((item, enc, next) => {
      next();
    })
  ); // null

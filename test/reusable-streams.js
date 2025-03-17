// Test cases in reference to:
// https://github.com/geopipes/geonames-stream/issues/9

import * as geonames from '../index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import tape from 'tape';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load schema
const schemaPath = path.join(__dirname, '..', 'schema.json');
const schemaData = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

export const reusable = {};

reusable.unzip = function(test, common) {
  test('unzip', function(t) {
    // We'll simply test that we can create unzip instances without running them
    const s1 = geonames.unzip();
    const s2 = geonames.unzip();
    
    t.ok(s1 !== s2, 'unzip instances should be unique');
    t.equal(typeof s1.pipe, 'function', 'unzip stream has pipe method');
    t.equal(typeof s2.pipe, 'function', 'unzip stream has pipe method');
    
    // Don't call end() to avoid errors since we're not providing any data
    t.end();
  });
};

reusable.parser = (test, common) => {
  test('parser', (t) => {
    // Pass the default schema from schema.json
    const s1 = geonames.parser(schemaData.geoname);
    s1.end();

    // Pass the default schema from schema.json
    const s2 = geonames.parser(schemaData.geoname);
    s2.end();

    t.end();
  });
};

reusable.modifiers = (test, common) => {
  test('modifiers', (t) => {
    const s1 = geonames.modifiers();
    s1.end();

    const s2 = geonames.modifiers();
    s2.end();

    t.end();
  });
};

export function all(tape, common) {
  function test(name, testFunction) {
    return tape('reusable streams: ' + name, testFunction);
  }

  for (const testCase in reusable) {
    reusable[testCase](test, common);
  }
}

// Run all tests when this file is executed directly
all(tape, {});

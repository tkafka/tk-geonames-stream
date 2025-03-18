import tape from 'tape';
import * as geonames from '../index.js';
import { Readable } from 'node:stream';

export function all(test, common) {
  test('module should be exported', (t) => {
    t.ok(geonames, 'module is defined');
    t.end();
  });

  test('should expose the unzip component', (t) => {
    t.ok(typeof geonames.unzip === 'function', 'unzip is a function');
    t.end();
  });

  test('should expose the parser component', (t) => {
    t.ok(typeof geonames.parser === 'function', 'parser is a function');
    t.end();
  });

  test('should expose the stringify component', (t) => {
    t.ok(typeof geonames.stringify === 'object', 'stringify is an object');
    t.end();
  });

  test('should expose the modifiers component', (t) => {
    t.ok(typeof geonames.modifiers === 'function', 'modifiers is a function');
    t.end();
  });

  test('should expose the pipeline component', (t) => {
    t.ok(typeof geonames.pipeline === 'object', 'pipeline is an object');
    t.end();
  });

  test('pipeline method on pipeline', (t) => {
    t.ok(
      typeof geonames.pipeline.pipelineMethod === 'function',
      'pipeline.pipeline is a function'
    );
    t.end();
  });

  test('should expose the createPipeline function', (t) => {
    t.ok(
      typeof geonames.createPipeline === 'function',
      'createPipeline is a function'
    );
    t.end();
  });

  test('createPipeline should return a stream with the correct methods', (t) => {
    // Create a readable stream with _read implementation
    class TestReadable extends Readable {
      _read() {}
    }
    const source = new TestReadable({ objectMode: true });
    const pipeline = geonames.createPipeline(source);
    t.ok(typeof pipeline.pipe === 'function', 'pipeline.pipe is a function');
    t.ok(typeof pipeline.on === 'function', 'pipeline.on is a function');
    t.ok(typeof pipeline.pause === 'function', 'pipeline.pause is a function');
    t.ok(typeof pipeline.resume === 'function', 'pipeline.resume is a function');
    t.end();
  });
}

// Run all tests when this file is executed directly
all(tape, {});

import { Transform } from 'node:stream';

/**
 * Creates a transform stream that splits input by newlines
 * @returns {Transform} A transform stream that splits input by newlines
 */
export default function createLineSplitter() {
  let buffer = '';
  
  return new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      const data = buffer + chunk.toString();
      const lines = data.split('\n');
      buffer = lines.pop() || ''; // Keep the last incomplete line in the buffer
      
      for (const line of lines) {
        this.push(line);
      }
      
      callback();
    },
    flush(callback) {
      if (buffer) {
        this.push(buffer);
      }
      callback();
    }
  });
} 
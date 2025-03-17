const tape = require('tape');

const common = {};

const tests = [require('./interface.js'), require('./reusable-streams.js')];

tests.map((t) => {
  t.all(tape, common);
});

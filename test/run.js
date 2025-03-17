import tape from 'tape';
import * as interfaceTests from './interface.js';
import * as reusableTests from './reusable-streams.js';

// Run the tests
interfaceTests.all(tape, {});
reusableTests.all(tape, {});

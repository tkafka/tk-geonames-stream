// Test cases in reference to:
// https://github.com/geopipes/geonames-stream/issues/9

var geonames = require('../');

module.exports.reusable = {};

// @todo: please make the test below pass:

// module.exports.reusable.unzip = function(test, common) {
//   test('unzip', function(t) {

//     var s1 = geonames.unzip();
//     s1.end();

//     var s2 = geonames.unzip();
//     s2.end();

//     t.end();
//   });
// };

module.exports.reusable.parser = (test, common) => {
  test('parser', (t) => {
    // Pass the default schema from schema.json
    var s1 = geonames.parser(require('../schema.json').geoname);
    s1.end();

    // Pass the default schema from schema.json
    var s2 = geonames.parser(require('../schema.json').geoname);
    s2.end();

    t.end();
  });
};

module.exports.reusable.modifiers = (test, common) => {
  test('modifiers', (t) => {
    var s1 = geonames.modifiers();
    s1.end();

    var s2 = geonames.modifiers();
    s2.end();

    t.end();
  });
};

module.exports.all = (tape, common) => {
  function test(name, testFunction) {
    return tape('reusable streams: ' + name, testFunction);
  }

  for (var testCase in module.exports.reusable) {
    module.exports.reusable[testCase](test, common);
  }
};

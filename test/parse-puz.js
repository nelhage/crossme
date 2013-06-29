#!/usr/bin/env node
var fs = require('fs'),
    Puz = require('../server/puz.js');

function main(path) {
  var buf = fs.readFileSync(path);
  var puz = new Puz(buf);
  console.log("Puz is %d x %d", puz.width, puz.height);
  for (var r = 0; r < puz.height; r++) {
    for (var c = 0; c < puz.width; c++) {
      if (puz.numbers[r][c]) {
        process.stdout.write('.');
      } else if (puz.solution[r][c] === null) {
        process.stdout.write('#');
      } else {
        process.stdout.write(' ');
      }
      process.stdout.write(' ');
    }
    process.stdout.write('\n');
  }
  console.log("---");
  puz.solution.forEach(function (r) {
    r.forEach(function (c) {
      process.stdout.write(c === null ? '#' : c);
      process.stdout.write(' ');
    });
    process.stdout.write('\n');
  });
}

main(process.argv[2]);

#!/usr/bin/env node
/* eslint-disable */

var fs = require('fs'),
    Puz = require('../server/puz.js');

global.Iconv = require('iconv').Iconv;

function main(path) {
  var buf = fs.readFileSync(path);
  var puz = new Puz(buf);
  console.log("Puzzle: ", puz.title);
  console.log(puz.copyright);
  for (var r = 0; r < puz.height; r++) {
    for (var c = 0; c < puz.width; c++) {
      if (puz.numbers[r][c]) {
        if (puz.circled[r][c]) {
          process.stdout.write('🞊');
        } else {
          process.stdout.write('•');
        }
      } else if (puz.solution[r][c] === null) {
        process.stdout.write('■');
      } else if (puz.circled[r][c]) {
        process.stdout.write('🞅');
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

  console.log("Across:")
  puz.across_clues.forEach(function (clue, index) {
    if (clue) {
      console.log("%d: %s", index, clue);
    }
  })
  console.log("Down:")
  puz.down_clues.forEach(function (clue, index) {
    if (clue) {
      console.log("%d: %s", index, clue);
    }
  })
}

main(process.argv[2]);

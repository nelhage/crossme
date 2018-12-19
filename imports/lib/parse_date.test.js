/* eslint-env mocha */
/* eslint-disable func-names, prefer-arrow-callback */

import chai from 'chai';

import parseDate from './parse_date.js';

describe('parseDate', function() {
  it('parses dates', function() {
    const cases = [
      {
        text: 'Fireball Newsflash Crosswords #17, 1/5/18',
        date: '2018-01-05',
      },
      {
        text: 'date date 01/05/18 time',
        date: '2018-01-05',
      },
      {
        text: 'NY Times, Sunday, May 31, 2015 Making Projections',
        date: '2015-05-31',
      },
    ];
    cases.forEach((tc) => {
      chai.assert.equal(
        parseDate([tc.text]), tc.date);
    });
  });
});

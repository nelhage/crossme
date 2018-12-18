/* eslint-env mocha */
/* eslint-disable func-names, prefer-arrow-callback */

import chai from 'chai';

import parseDate from './parse_date.js';

describe('parseDate', function() {
  it('parses dates', function() {
    chai.assert.equal(
      parseDate(['NY Times, Sunday, May 31, 2015 Making Projections']),
      '2015-05-31');
  });
});

const moment = require('moment');

const DATE_PATTERNS = [
  {
    re: /\w+\s+\d+,?\s+\d+/g,
    pat: 'MMMM DD YYYY Z',
  },
  {
    re: /\d{1,2}\/\d{1,2}\/\d{2,4}/g,
    pat: 'MM/DD/YYY',
  },
];
const MIN_DATE = moment('1940-01-01');

function parseDateOne(field) {
  const maxDate = moment().add(1, 'year');

  for (let i = 0; i < DATE_PATTERNS.length; i += 1) {
    const pat = DATE_PATTERNS[i];
    const matches = field.match(pat.re);
    if (!matches) {
      return null;
    }
    for (let j = 0; j < matches.length; j += 1) {
      const match = matches[j];
      const date = moment(match, pat.pat);
      if (date.isValid() && date.isAfter(MIN_DATE) && date.isBefore(maxDate)) {
        return date;
      }
    }
  }
  return null;
}

export default function parseDate(fields) {
  for (let i = 0; i < fields.length; i += 1) {
    const date = parseDateOne(fields[i]);
    if (date !== null) {
      return date.format('Y-MM-DD');
    }
  }
  return null;
}

package repo

import "testing"

func TestParseDate(t *testing.T) {
	cases := []struct {
		text string
		date string
	}{
		{"Fireball Newsflash Crosswords #17, 1/5/18", "2018-01-05"},
		{"date date 01/05/18 time", "2018-01-05"},
		{"NY Times, Sunday, May 31, 2015 Making Projections", "2015-05-31"},
		{"1-2-3", ""},
	}
	for _, tc := range cases {
		date, ok := parseDate(tc.text)
		if ok {
			if tc.date == "" {
				t.Errorf("parseDate(%q) = %s, not err", tc.text, date)
				continue
			}
			if date.Format("2006-01-02") != tc.date {
				t.Errorf("parseDate(%q) = %s, want %s", tc.text, date, tc.date)
			}
		} else {
			if tc.date != "" {
				t.Errorf("parseDate(%q) = err, want %s", tc.text, tc.date)
			}
		}
	}
}

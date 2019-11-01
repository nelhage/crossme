package repo

import (
	"regexp"
	"time"

	"crossme.app/src/pb"
	"crossme.app/src/puz"
)

type datePattern struct {
	re     *regexp.Regexp
	layout string
}

var datePatterns []datePattern = []datePattern{
	{
		regexp.MustCompile(`\d{1,2}/\d{1,2}/\d{2,4}`),
		"1/2/06",
	}, {
		regexp.MustCompile(`\w+\s+\d+,?\s+\d+`),
		"Jan 02, 2006",
	},
}

var minDate = time.Date(1940, 1, 1, 0, 0, 0, 0, time.UTC)

func parseDate(field string) (time.Time, bool) {
	for _, pat := range datePatterns {
		matches := pat.re.FindAllString(field, -1)
		for _, m := range matches {
			t, err := time.Parse(pat.layout, m)
			if err == nil && t.After(minDate) {
				return t, true
			}
		}
	}
	return time.Time{}, false
}

func Puz2Proto(puz *puz.PuzFile) *pb.Puzzle {
	proto := pb.Puzzle{
		Title:       puz.Title,
		Author:      puz.Author,
		Copyright:   puz.Copyright,
		Note:        puz.Notes,
		Width:       int32(puz.Width),
		Height:      int32(puz.Height),
		Squares:     make([]*pb.Puzzle_Cell, 0, len(puz.Cells)),
		AcrossClues: make([]*pb.Puzzle_Clue, 0, len(puz.CluesAcross)),
		DownClues:   make([]*pb.Puzzle_Clue, 0, len(puz.CluesDown)),
	}
	for _, sq := range puz.Cells {
		proto.Squares = append(proto.Squares, &pb.Puzzle_Cell{
			Black:      sq.Black,
			Number:     int32(sq.Number),
			Circled:    sq.Circled,
			Fill:       sq.Fill,
			ClueAcross: int32(sq.WordAcross),
			ClueDown:   int32(sq.WordDown),
		})
	}
	for _, cl := range puz.CluesAcross {
		proto.AcrossClues = append(proto.AcrossClues,
			&pb.Puzzle_Clue{
				Number: int32(cl.Number),
				Text:   cl.Text,
			})
	}
	for _, cl := range puz.CluesDown {
		proto.DownClues = append(proto.DownClues,
			&pb.Puzzle_Clue{
				Number: int32(cl.Number),
				Text:   cl.Text,
			})
	}
	proto.Metadata = &pb.Puzzle_Meta{}
	for _, field := range []string{
		puz.Title,
		puz.Notes,
		puz.Copyright,
	} {
		if date, ok := parseDate(field); ok {
			proto.Metadata.Date = date.Format("2006-01-02")
			break
		}
	}

	return &proto
}

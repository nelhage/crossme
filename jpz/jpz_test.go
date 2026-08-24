package jpz

import (
	"os"
	"path"
	"strings"
	"testing"

	"golang.org/x/text/encoding/charmap"

	"crossme.app/src/puz"
)

// checkMini asserts the interesting properties of the testdata/mini
// puzzle, which both the bare-XML and zipped fixtures contain.
func checkMini(t *testing.T, p *puz.PuzFile) {
	t.Helper()
	if p.Width != 5 || p.Height != 5 {
		t.Fatalf("grid is %dx%d, want 5x5", p.Width, p.Height)
	}
	if p.Title != "Test Mini" || p.Author != "A. Constructor" {
		t.Errorf("metadata: title=%q author=%q", p.Title, p.Author)
	}
	if p.Copyright != "© 2026 Testers" {
		t.Errorf("copyright=%q", p.Copyright)
	}
	if p.Notes != "A tiny test puzzle." {
		t.Errorf("notes=%q", p.Notes)
	}

	if !p.At(4, 0).Black || !p.At(0, 4).Black {
		t.Errorf("expected blocks at (5,1) and (1,5)")
	}
	if got := p.At(1, 0).Fill; got != "BEE" {
		t.Errorf("rebus cell (2,1) fill=%q, want BEE", got)
	}
	if !p.At(2, 2).Circled {
		t.Errorf("cell (3,3) should be circled")
	}
	if got := p.At(2, 2).Fill; got != "M" {
		t.Errorf("cell (3,3) fill=%q, want M (upcased)", got)
	}
	if got := p.At(4, 1).Number; got != 6 {
		t.Errorf("cell (5,2) number=%d, want 6", got)
	}
	if got := p.At(2, 1); got.WordAcross != 5 || got.WordDown != 3 {
		t.Errorf("cell (3,2) words across=%d down=%d, want 5/3", got.WordAcross, got.WordDown)
	}
	if got := p.At(4, 2); got.WordAcross != 7 || got.WordDown != 6 {
		t.Errorf("cell (5,3) words across=%d down=%d, want 7/6", got.WordAcross, got.WordDown)
	}

	acrossNums := []int{1, 5, 7, 8, 9}
	downNums := []int{1, 2, 3, 4, 6}
	if len(p.CluesAcross) != len(acrossNums) || len(p.CluesDown) != len(downNums) {
		t.Fatalf("got %d across/%d down clues, want 5/5", len(p.CluesAcross), len(p.CluesDown))
	}
	for i, n := range acrossNums {
		if p.CluesAcross[i].Number != n {
			t.Errorf("across clue %d has number %d, want %d", i, p.CluesAcross[i].Number, n)
		}
	}
	for i, n := range downNums {
		if p.CluesDown[i].Number != n {
			t.Errorf("down clue %d has number %d, want %d", i, p.CluesDown[i].Number, n)
		}
	}
	if got := p.CluesAcross[2].Text; got != "Clue with bold & entity" {
		t.Errorf("formatted clue text=%q", got)
	}
}

func TestFromFile(t *testing.T) {
	// daily.jpz and cryptic.jpz are real published puzzles run through
	// scripts/sanitize-jpz, which keeps the grid, numbering, and XML
	// structure but replaces solutions and clue text with dummy content.
	shapes := map[string]struct{ w, h, across, down int }{
		"mini.xml":    {5, 5, 5, 5},
		"mini.jpz":    {5, 5, 5, 5},
		"daily.jpz":   {14, 11, 19, 22},
		"cryptic.jpz": {15, 15, 14, 14},
	}
	dents, err := os.ReadDir("testdata")
	if err != nil {
		t.Fatal(err)
	}
	for _, ent := range dents {
		p, err := FromFile(path.Join("testdata", ent.Name()))
		if err != nil {
			t.Errorf("FromFile(%q): %v", ent.Name(), err)
			continue
		}
		want, ok := shapes[ent.Name()]
		if !ok {
			t.Errorf("no expected shape for testdata/%s; add one", ent.Name())
			continue
		}
		if p.Width != want.w || p.Height != want.h ||
			len(p.CluesAcross) != want.across || len(p.CluesDown) != want.down {
			t.Errorf("%s: got %dx%d with %d across/%d down clues, want %dx%d %d/%d",
				ent.Name(), p.Width, p.Height, len(p.CluesAcross), len(p.CluesDown),
				want.w, want.h, want.across, want.down)
		}
		if strings.HasPrefix(ent.Name(), "mini.") {
			checkMini(t, p)
		}
	}
}

// A minimal valid single-cell template for the rejection tests below:
// substitute the CELLS/WORDS/CLUES markers to make targeted invalid
// documents.
const template = `<?xml version="1.0" encoding="UTF-8"?>
<crossword-compiler-applet xmlns="http://crossword.info/xml/crossword-compiler-applet">
  <rectangular-puzzle xmlns="http://crossword.info/xml/rectangular-puzzle">
    <metadata><title>T</title></metadata>
    <crossword>
      <grid width="2" height="1">CELLS</grid>
      WORDS
      <clues><title>Across</title>CLUES_A</clues>
      <clues><title>Down</title>CLUES_D</clues>
    </crossword>
  </rectangular-puzzle>
</crossword-compiler-applet>`

func fill(cells, words, cluesA, cluesD string) []byte {
	s := template
	s = strings.Replace(s, "CELLS", cells, 1)
	s = strings.Replace(s, "WORDS", words, 1)
	s = strings.Replace(s, "CLUES_A", cluesA, 1)
	s = strings.Replace(s, "CLUES_D", cluesD, 1)
	return []byte(s)
}

const (
	okCells = `<cell x="1" y="1" solution="A" number="1"/><cell x="2" y="1" solution="B"/>`
	okWords = `<word id="1" x="1-2" y="1"/>`
	okClueA = `<clue word="1" number="1">c</clue>`
)

func TestRejectsUnsupported(t *testing.T) {
	tests := []struct {
		name string
		data []byte
		want string
	}{
		{
			"barred",
			fill(`<cell x="1" y="1" solution="A" number="1"/><cell x="2" y="1" solution="B" left-bar="true"/>`,
				okWords, okClueA, ""),
			"barred grids",
		},
		{
			"shaded",
			fill(`<cell x="1" y="1" solution="A" number="1" background-color="#FF0000"/><cell x="2" y="1" solution="B"/>`,
				okWords, okClueA, ""),
			"shaded cells",
		},
		{
			"void",
			fill(`<cell x="1" y="1" solution="A" number="1"/><cell x="2" y="1" type="void"/>`,
				okWords, okClueA, ""),
			"void cells",
		},
		{
			"missing solution",
			fill(`<cell x="1" y="1" solution="A" number="1"/><cell x="2" y="1"/>`,
				okWords, okClueA, ""),
			"no solution",
		},
		{
			"missing cell",
			fill(`<cell x="1" y="1" solution="A" number="1"/>`,
				okWords, okClueA, ""),
			"missing cell (2,1)",
		},
		{
			"unknown word",
			fill(okCells, okWords, `<clue word="9" number="1">c</clue>`, ""),
			"unknown word",
		},
		{
			"non-standard numbering",
			fill(okCells, okWords, `<clue word="1" number="3">c</clue>`, ""),
			"non-standard numbering",
		},
		{
			"diagonal word",
			fill(`<cell x="1" y="1" solution="A" number="1"/><cell x="2" y="1" solution="B" number="2"/>`,
				`<word id="1"><cells x="1" y="1"/><cells x="2" y="1"/></word>`,
				"", `<clue word="1" number="1">c</clue>`),
			"contiguous down run",
		},
		{
			"variety clue list",
			[]byte(strings.Replace(string(fill(okCells, okWords, okClueA, "")),
				"<title>Down</title>", "<title>Diagonal</title>", 1)),
			"not supported (only Across and Down)",
		},
		{
			"coded",
			[]byte(`<?xml version="1.0"?><crossword-compiler><rectangular-puzzle><coded/></rectangular-puzzle></crossword-compiler>`),
			"coded crosswords",
		},
		{
			"not a puzzle",
			[]byte(`<?xml version="1.0"?><html><body>hi</body></html>`),
			"rectangular-puzzle",
		},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			_, err := FromBytes(tc.data)
			if err == nil {
				t.Fatalf("expected an error containing %q, got none", tc.want)
			}
			if !strings.Contains(err.Error(), tc.want) {
				t.Errorf("error %q does not contain %q", err.Error(), tc.want)
			}
		})
	}
}

// A bare rectangular-puzzle root (no applet wrapper) also parses.
func TestBareRoot(t *testing.T) {
	doc := `<?xml version="1.0" encoding="UTF-8"?>
<rectangular-puzzle xmlns="http://crossword.info/xml/rectangular-puzzle">
  <metadata><title>Bare</title></metadata>
  <crossword>
    <grid width="2" height="1">` + okCells + `</grid>
    ` + okWords + `
    <clues><title>Across</title>` + okClueA + `</clues>
    <clues><title>Down</title></clues>
  </crossword>
</rectangular-puzzle>`
	p, err := FromBytes([]byte(doc))
	if err != nil {
		t.Fatal(err)
	}
	if p.Title != "Bare" || len(p.CluesAcross) != 1 {
		t.Errorf("title=%q across=%d", p.Title, len(p.CluesAcross))
	}
}

// Clue numbering can be reconstructed from the clues when the grid
// omits cell numbers.
func TestNumbersFromClues(t *testing.T) {
	data := fill(
		`<cell x="1" y="1" solution="A"/><cell x="2" y="1" solution="B"/>`,
		okWords, okClueA, "")
	p, err := FromBytes(data)
	if err != nil {
		t.Fatal(err)
	}
	if got := p.At(0, 0).Number; got != 1 {
		t.Errorf("cell (1,1) number=%d, want 1 (from clue)", got)
	}
}

func TestLatin1(t *testing.T) {
	utf8Doc := strings.Replace(string(fill(okCells, okWords,
		`<clue word="1" number="1">Café society</clue>`, "")),
		`encoding="UTF-8"`, `encoding="ISO-8859-1"`, 1)
	latin1, err := charmap.Windows1252.NewEncoder().String(utf8Doc)
	if err != nil {
		t.Fatal(err)
	}
	p, err := FromBytes([]byte(latin1))
	if err != nil {
		t.Fatal(err)
	}
	if got := p.CluesAcross[0].Text; got != "Café society" {
		t.Errorf("latin1 clue text=%q", got)
	}
}

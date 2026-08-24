// Package jpz parses the Crossword Compiler XML crossword format,
// conventionally distributed with a ".jpz" extension. A .jpz file is
// usually a zip archive containing a single XML document, but is
// sometimes shipped as the bare XML; FromBytes accepts either.
//
// The format (schema at
// https://crossword.info/xml/rectangular-puzzle.xsd) can express many
// features CrossMe cannot yet represent: barred grids, shaded cells,
// words in arbitrary directions, coded crosswords, and so on. This
// parser handles standard crosswords -- blocks, circles, rebus
// entries, across/down clues -- and returns a clear error for puzzles
// that use anything we would otherwise have to silently drop. The
// original file bytes are stored alongside every imported puzzle, so
// puzzles imported today can be re-parsed if support improves.
package jpz

import (
	"archive/zip"
	"bytes"
	"encoding/xml"
	"errors"
	"fmt"
	"io"
	"os"
	"sort"
	"strconv"
	"strings"

	"golang.org/x/text/encoding/charmap"

	"crossme.app/src/puz"
)

var (
	zipMagic = []byte("PK\x03\x04")
	utf8BOM  = []byte("\xef\xbb\xbf")
)

// Is reports whether data plausibly holds a .jpz file: either a zip
// archive or a bare XML document. It is a cheap sniff for format
// dispatch, not a validation; FromBytes still fails on non-puzzle
// input.
func Is(data []byte) bool {
	if bytes.HasPrefix(data, zipMagic) {
		return true
	}
	trimmed := bytes.TrimLeft(bytes.TrimPrefix(data, utf8BOM), " \t\r\n")
	return bytes.HasPrefix(trimmed, []byte("<"))
}

// FromBytes parses a .jpz file (zipped or bare XML) into the same
// in-memory representation the puz package produces, so the rest of
// the import pipeline is format-agnostic.
func FromBytes(data []byte) (*puz.PuzFile, error) {
	if bytes.HasPrefix(data, zipMagic) {
		var err error
		data, err = unzip(data)
		if err != nil {
			return nil, fmt.Errorf("jpz: reading zip: %w", err)
		}
	}
	doc, err := parseXML(data)
	if err != nil {
		return nil, err
	}
	return convert(doc)
}

func FromFile(path string) (*puz.PuzFile, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	return FromBytes(data)
}

// unzip extracts the XML document from a zipped .jpz: the entry named
// like an XML/jpz file if there is one, otherwise the first entry.
func unzip(data []byte) ([]byte, error) {
	zr, err := zip.NewReader(bytes.NewReader(data), int64(len(data)))
	if err != nil {
		return nil, err
	}
	var entry *zip.File
	for _, f := range zr.File {
		if f.FileInfo().IsDir() {
			continue
		}
		lower := strings.ToLower(f.Name)
		if entry == nil || strings.HasSuffix(lower, ".xml") || strings.HasSuffix(lower, ".jpz") {
			entry = f
		}
		if strings.HasSuffix(lower, ".xml") {
			break
		}
	}
	if entry == nil {
		return nil, errors.New("empty archive")
	}
	r, err := entry.Open()
	if err != nil {
		return nil, err
	}
	defer r.Close()
	return io.ReadAll(r)
}

// The XML document structure. Tag names deliberately omit namespaces:
// encoding/xml then matches on local name, which tolerates the
// several namespace arrangements seen in the wild
// (crossword-compiler-applet vs. crossword-compiler roots, etc).

type xmlDoc struct {
	Puzzle *xmlRectPuzzle `xml:"rectangular-puzzle"`
}

type xmlRectPuzzle struct {
	Metadata     xmlMetadata   `xml:"metadata"`
	Instructions flatText      `xml:"instructions"`
	Crossword    *xmlCrossword `xml:"crossword"`
	Coded        *xmlIgnored   `xml:"coded"`
	Sudoku       *xmlIgnored   `xml:"sudoku"`
	WordSearch   *xmlIgnored   `xml:"word-search"`
	Acrostic     *xmlIgnored   `xml:"acrostic"`
}

type xmlIgnored struct{}

type xmlMetadata struct {
	Title       flatText `xml:"title"`
	Creator     flatText `xml:"creator"`
	Copyright   flatText `xml:"copyright"`
	Description flatText `xml:"description"`
}

type xmlCrossword struct {
	Grid  xmlGrid    `xml:"grid"`
	Words []xmlWord  `xml:"word"`
	Clues []xmlClues `xml:"clues"`
}

type xmlGrid struct {
	Width  int       `xml:"width,attr"`
	Height int       `xml:"height,attr"`
	Cells  []xmlCell `xml:"cell"`
}

type xmlCell struct {
	X               int    `xml:"x,attr"`
	Y               int    `xml:"y,attr"`
	Solution        string `xml:"solution,attr"`
	Number          string `xml:"number,attr"`
	Type            string `xml:"type,attr"`
	BackgroundShape string `xml:"background-shape,attr"`
	BackgroundColor string `xml:"background-color,attr"`
	TopBar          string `xml:"top-bar,attr"`
	LeftBar         string `xml:"left-bar,attr"`
}

type xmlWord struct {
	ID    string        `xml:"id,attr"`
	X     string        `xml:"x,attr"`
	Y     string        `xml:"y,attr"`
	Cells []xmlWordCell `xml:"cells"`
}

type xmlWordCell struct {
	X string `xml:"x,attr"`
	Y string `xml:"y,attr"`
}

type xmlClues struct {
	Title flatText  `xml:"title"`
	Clues []xmlClue `xml:"clue"`
}

type xmlClue struct {
	Word   string
	Number string
	Text   string
}

func (c *xmlClue) UnmarshalXML(d *xml.Decoder, start xml.StartElement) error {
	for _, a := range start.Attr {
		switch a.Name.Local {
		case "word":
			c.Word = a.Value
		case "number":
			c.Number = a.Value
		}
	}
	text, err := flatten(d)
	c.Text = text
	return err
}

// flatText collects the text of an element, discarding any inline
// markup (<b>, <i>, <span>, ...) but keeping its contents. Clue lists
// are titled things like <title><b>Across</b></title>, and clue text
// can carry the same formatting.
type flatText string

func (f *flatText) UnmarshalXML(d *xml.Decoder, start xml.StartElement) error {
	text, err := flatten(d)
	*f = flatText(text)
	return err
}

func flatten(d *xml.Decoder) (string, error) {
	var sb strings.Builder
	depth := 1
	for depth > 0 {
		tok, err := d.Token()
		if err != nil {
			return "", err
		}
		switch t := tok.(type) {
		case xml.StartElement:
			depth++
			if t.Name.Local == "br" {
				sb.WriteString("\n")
			}
		case xml.EndElement:
			depth--
		case xml.CharData:
			sb.Write(t)
		}
	}
	return strings.TrimSpace(sb.String()), nil
}

func newDecoder(data []byte) *xml.Decoder {
	d := xml.NewDecoder(bytes.NewReader(bytes.TrimPrefix(data, utf8BOM)))
	d.CharsetReader = charsetReader
	return d
}

// charsetReader handles the non-UTF-8 encodings .jpz files declare in
// practice. ISO-8859-1 is decoded as Windows-1252, its de-facto
// superset: the bytes where they differ are control characters no
// text uses, and files labeled 8859-1 routinely contain 1252 smart
// quotes.
func charsetReader(charset string, input io.Reader) (io.Reader, error) {
	switch strings.ToLower(charset) {
	case "utf-8", "utf8", "us-ascii", "ascii":
		return input, nil
	case "iso-8859-1", "iso8859-1", "latin1", "windows-1252", "cp1252":
		return charmap.Windows1252.NewDecoder().Reader(input), nil
	}
	return nil, fmt.Errorf("unsupported charset %q", charset)
}

// parseXML locates the <rectangular-puzzle>, whether wrapped in a
// <crossword-compiler-applet>/<crossword-compiler> root or standing
// alone as the document root.
func parseXML(data []byte) (*xmlRectPuzzle, error) {
	var wrapper xmlDoc
	if err := newDecoder(data).Decode(&wrapper); err != nil {
		return nil, fmt.Errorf("jpz: parsing XML: %w", err)
	}
	if wrapper.Puzzle != nil {
		return wrapper.Puzzle, nil
	}
	var direct xmlRectPuzzle
	if err := newDecoder(data).Decode(&direct); err != nil {
		return nil, fmt.Errorf("jpz: parsing XML: %w", err)
	}
	if direct.Crossword != nil || direct.Coded != nil || direct.Sudoku != nil ||
		direct.WordSearch != nil || direct.Acrostic != nil {
		return &direct, nil
	}
	return nil, errors.New("jpz: no <rectangular-puzzle> element found")
}

type coord struct {
	x, y int
}

func convert(doc *xmlRectPuzzle) (*puz.PuzFile, error) {
	cw := doc.Crossword
	if cw == nil {
		for name, present := range map[string]bool{
			"coded crosswords": doc.Coded != nil,
			"sudoku":           doc.Sudoku != nil,
			"word searches":    doc.WordSearch != nil,
			"acrostics":        doc.Acrostic != nil,
		} {
			if present {
				return nil, fmt.Errorf("jpz: %s are not supported", name)
			}
		}
		return nil, errors.New("jpz: no <crossword> element found")
	}

	w, h := cw.Grid.Width, cw.Grid.Height
	if w <= 0 || h <= 0 {
		return nil, fmt.Errorf("jpz: bad grid size %dx%d", w, h)
	}

	p := &puz.PuzFile{
		Version:   "jpz",
		Width:     w,
		Height:    h,
		Title:     string(doc.Metadata.Title),
		Author:    string(doc.Metadata.Creator),
		Copyright: string(doc.Metadata.Copyright),
		Notes:     joinNotes(string(doc.Metadata.Description), string(doc.Instructions)),
		Cells:     make([]puz.Cell, w*h),
	}

	if err := fillGrid(p, cw.Grid.Cells); err != nil {
		return nil, err
	}

	words := make(map[string][]coord, len(cw.Words))
	for _, wd := range cw.Words {
		if wd.ID == "" {
			return nil, errors.New("jpz: <word> with no id")
		}
		cells, err := wordCells(wd)
		if err != nil {
			return nil, err
		}
		words[wd.ID] = cells
	}

	var across, down *xmlClues
	for i := range cw.Clues {
		list := &cw.Clues[i]
		title := strings.ToLower(strings.TrimSpace(string(list.Title)))
		switch title {
		case "across":
			if across != nil {
				return nil, errors.New("jpz: multiple Across clue lists")
			}
			across = list
		case "down":
			if down != nil {
				return nil, errors.New("jpz: multiple Down clue lists")
			}
			down = list
		default:
			return nil, fmt.Errorf("jpz: clue list %q is not supported (only Across and Down)", string(list.Title))
		}
	}
	if across == nil || down == nil {
		return nil, errors.New("jpz: puzzle must have Across and Down clue lists")
	}

	var err error
	if p.CluesAcross, err = assignClues(p, across, words, true); err != nil {
		return nil, err
	}
	if p.CluesDown, err = assignClues(p, down, words, false); err != nil {
		return nil, err
	}
	return p, nil
}

func joinNotes(parts ...string) string {
	var nonEmpty []string
	for _, s := range parts {
		if s != "" {
			nonEmpty = append(nonEmpty, s)
		}
	}
	return strings.Join(nonEmpty, "\n\n")
}

func fillGrid(p *puz.PuzFile, cells []xmlCell) error {
	seen := make([]bool, len(p.Cells))
	for _, c := range cells {
		if c.X < 1 || c.X > p.Width || c.Y < 1 || c.Y > p.Height {
			return fmt.Errorf("jpz: cell (%d,%d) outside the %dx%d grid", c.X, c.Y, p.Width, p.Height)
		}
		i := (c.X - 1) + (c.Y-1)*p.Width
		if seen[i] {
			return fmt.Errorf("jpz: duplicate cell (%d,%d)", c.X, c.Y)
		}
		seen[i] = true

		if c.TopBar == "true" || c.LeftBar == "true" {
			return errors.New("jpz: barred grids are not supported yet")
		}
		cell := &p.Cells[i]
		switch c.Type {
		case "block":
			cell.Black = true
		case "", "letter":
			if c.BackgroundColor != "" {
				return errors.New("jpz: shaded cells are not supported yet")
			}
			if c.Solution == "" {
				return fmt.Errorf("jpz: cell (%d,%d) has no solution", c.X, c.Y)
			}
			cell.Fill = strings.ToUpper(c.Solution)
			if c.BackgroundShape == "circle" {
				cell.Circled = true
			}
			if c.Number != "" {
				n, err := strconv.Atoi(c.Number)
				if err != nil || n <= 0 {
					return fmt.Errorf("jpz: non-numeric cell number %q is not supported", c.Number)
				}
				cell.Number = n
			}
		case "void":
			return errors.New("jpz: void cells are not supported yet")
		case "clue":
			return errors.New("jpz: in-grid clue cells are not supported yet")
		default:
			return fmt.Errorf("jpz: unknown cell type %q", c.Type)
		}
	}
	for i, ok := range seen {
		if !ok {
			return fmt.Errorf("jpz: missing cell (%d,%d)", i%p.Width+1, i/p.Width+1)
		}
	}
	return nil
}

// wordCells expands a <word> into its cell coordinates: either
// x/y attributes where one may be a range ("3" / "1-5"), or a list of
// <cells> children in the same shape.
func wordCells(wd xmlWord) ([]coord, error) {
	var cells []coord
	appendSpan := func(xspec, yspec string) error {
		x0, x1, err := parseRange(xspec)
		if err != nil {
			return fmt.Errorf("jpz: word %s: bad x %q", wd.ID, xspec)
		}
		y0, y1, err := parseRange(yspec)
		if err != nil {
			return fmt.Errorf("jpz: word %s: bad y %q", wd.ID, yspec)
		}
		if x0 != x1 && y0 != y1 {
			return fmt.Errorf("jpz: word %s spans a rectangle, not a line", wd.ID)
		}
		for y := y0; y <= y1; y++ {
			for x := x0; x <= x1; x++ {
				cells = append(cells, coord{x, y})
			}
		}
		return nil
	}
	if wd.X != "" || wd.Y != "" {
		if err := appendSpan(wd.X, wd.Y); err != nil {
			return nil, err
		}
	}
	for _, c := range wd.Cells {
		if err := appendSpan(c.X, c.Y); err != nil {
			return nil, err
		}
	}
	if len(cells) == 0 {
		return nil, fmt.Errorf("jpz: word %s has no cells", wd.ID)
	}
	return cells, nil
}

func parseRange(spec string) (int, int, error) {
	if spec == "" {
		return 0, 0, errors.New("empty")
	}
	lo, hi := spec, spec
	if i := strings.IndexByte(spec, '-'); i >= 0 {
		lo, hi = spec[:i], spec[i+1:]
	}
	a, err := strconv.Atoi(lo)
	if err != nil {
		return 0, 0, err
	}
	b, err := strconv.Atoi(hi)
	if err != nil {
		return 0, 0, err
	}
	if a > b {
		return 0, 0, fmt.Errorf("backwards range %q", spec)
	}
	return a, b, nil
}

// assignClues resolves one clue list against the word map: it checks
// each word really is a straight across or down run of letter cells,
// reconciles the clue's number with the grid numbering, and stamps
// WordAcross/WordDown on the covered cells.
func assignClues(p *puz.PuzFile, list *xmlClues, words map[string][]coord, isAcross bool) ([]puz.Clue, error) {
	dir := "down"
	if isAcross {
		dir = "across"
	}
	clues := make([]puz.Clue, 0, len(list.Clues))
	numbers := make(map[int]bool, len(list.Clues))
	for _, cl := range list.Clues {
		cells, ok := words[cl.Word]
		if !ok {
			return nil, fmt.Errorf("jpz: %s clue references unknown word %q", dir, cl.Word)
		}
		sort.Slice(cells, func(i, j int) bool {
			if cells[i].y != cells[j].y {
				return cells[i].y < cells[j].y
			}
			return cells[i].x < cells[j].x
		})
		for i, c := range cells {
			if c.x < 1 || c.x > p.Width || c.y < 1 || c.y > p.Height {
				return nil, fmt.Errorf("jpz: word %s cell (%d,%d) outside the grid", cl.Word, c.x, c.y)
			}
			if p.At(c.x-1, c.y-1).Black {
				return nil, fmt.Errorf("jpz: word %s covers the block at (%d,%d)", cl.Word, c.x, c.y)
			}
			if i > 0 {
				prev := cells[i-1]
				straight := (isAcross && c.y == prev.y && c.x == prev.x+1) ||
					(!isAcross && c.x == prev.x && c.y == prev.y+1)
				if !straight {
					return nil, fmt.Errorf("jpz: word %s is not a contiguous %s run; only standard across/down words are supported", cl.Word, dir)
				}
			}
		}

		first := p.At(cells[0].x-1, cells[0].y-1)
		number := first.Number
		if cl.Number != "" {
			n, err := strconv.Atoi(cl.Number)
			if err != nil || n <= 0 {
				return nil, fmt.Errorf("jpz: non-numeric clue number %q is not supported", cl.Number)
			}
			if number == 0 {
				// The grid omitted cell numbers; take the
				// clue's numbering as the grid's.
				first.Number, number = n, n
			} else if number != n {
				return nil, fmt.Errorf("jpz: %s clue %d starts at a cell numbered %d; non-standard numbering is not supported", dir, n, number)
			}
		}
		if number == 0 {
			return nil, fmt.Errorf("jpz: no number for %s clue on word %s", dir, cl.Word)
		}
		if numbers[number] {
			return nil, fmt.Errorf("jpz: duplicate %s clue %d", dir, number)
		}
		numbers[number] = true

		for _, c := range cells {
			cell := p.At(c.x-1, c.y-1)
			ref := &cell.WordDown
			if isAcross {
				ref = &cell.WordAcross
			}
			if *ref != 0 {
				return nil, fmt.Errorf("jpz: cell (%d,%d) is covered by two %s words", c.x, c.y, dir)
			}
			*ref = number
		}
		clues = append(clues, puz.Clue{Number: number, Text: cl.Text})
	}
	sort.Slice(clues, func(i, j int) bool { return clues[i].Number < clues[j].Number })
	return clues, nil
}

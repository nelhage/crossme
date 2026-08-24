// Package formats detects which supported crossword file format a
// blob of bytes holds, and parses it. All formats parse into the puz
// package's in-memory representation, so callers downstream of import
// are format-agnostic.
package formats

import (
	"errors"

	"crossme.app/src/jpz"
	"crossme.app/src/puz"
)

// Parse parses a puzzle file in any supported format (Across Lite
// .puz, or Crossword Compiler .jpz as either zip or bare XML),
// detected from the bytes themselves.
func Parse(data []byte) (*puz.PuzFile, error) {
	switch {
	case isPuz(data):
		return puz.FromBytes(data)
	case jpz.Is(data):
		return jpz.FromBytes(data)
	default:
		return nil, errors.New("unrecognized puzzle format (supported: .puz, .jpz)")
	}
}

func isPuz(data []byte) bool {
	return len(data) >= 0x0E && string(data[0x02:0x0E]) == puz.PuzMagic
}

package puz

import (
	"bytes"
	"errors"
	"unicode/utf8"

	"golang.org/x/text/encoding/charmap"
)

type stringReader struct {
	data []byte
	err  error
}

func (s *stringReader) next() string {
	if s.err != nil {
		return ""
	}
	nul := bytes.IndexByte(s.data, 0)
	if nul == -1 {
		s.err = errors.New("No NUL byte found")
		return ""
	}
	bytes := s.data[:nul]
	s.data = s.data[nul+1:]

	if !utf8.Valid(bytes) {
		bytes, s.err = charmap.ISO8859_1.NewDecoder().Bytes(bytes)
		if s.err != nil {
			return ""
		}
	}

	return string(bytes)
}

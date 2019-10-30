package puz

import (
	"bytes"
	"errors"

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
	str, err := charmap.ISO8859_1.NewDecoder().Bytes(s.data[:nul])
	if err != nil {
		s.err = err
		return ""
	}
	s.data = s.data[nul+1:]
	return string(str)
}

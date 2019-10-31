package puz

import (
	"encoding/binary"
	"fmt"
	"io/ioutil"
	"strconv"
	"strings"
)

type Cell struct {
	Black bool

	// 0 means "no number"
	Number int

	WordAcross int
	WordDown   int

	Fill    string
	Circled bool
}

type Clue struct {
	Number int
	Text   string
}

type PuzFile struct {
	Version   string
	Height    int
	Width     int
	Title     string
	Author    string
	Copyright string
	Notes     string

	Cells []Cell

	CluesDown   []Clue
	CluesAcross []Clue
}

func (p *PuzFile) At(x, y int) *Cell {
	return &p.Cells[x+y*p.Width]
}

func (p *PuzFile) needsAcross(x, y int) bool {
	if x == 0 || p.At(x-1, y).Black {
		if x+1 < p.Width && !p.At(x+1, y).Black {
			return true
		}
	}
	return false
}

func (p *PuzFile) needsDown(x, y int) bool {
	if y == 0 || p.At(x, y-1).Black {
		if y+1 < p.Height && !p.At(x, y+1).Black {
			return true
		}
	}
	return false
}

func (p *PuzFile) assign(clues []string) {
	number := 1

	for y := 0; y < p.Height; y++ {
		for x := 0; x < p.Width; x++ {
			sq := p.At(x, y)
			if sq.Black {
				continue
			}
			if p.needsAcross(x, y) {
				sq.Number = number
				p.CluesAcross = append(p.CluesAcross, Clue{
					Number: number,
					Text:   clues[0],
				})
				clues = clues[1:]
				for xx := x; xx < p.Width && !p.At(xx, y).Black; xx++ {
					p.At(xx, y).WordAcross = number
				}
			}
			if p.needsDown(x, y) {
				sq.Number = number
				p.CluesDown = append(p.CluesDown, Clue{
					Number: number,
					Text:   clues[0],
				})
				clues = clues[1:]
				for yy := y; yy < p.Height && !p.At(x, yy).Black; yy++ {
					p.At(x, yy).WordDown = number
				}
			}
			if sq.Number != 0 {
				number++
			}
		}
	}
}

const (
	HeaderLen = 0x34
	PuzMagic  = "ACROSS&DOWN\x00"
)

func FromBytes(data []byte) (*PuzFile, error) {
	if len(data) < HeaderLen {
		return nil, fmt.Errorf("Data too short: len=%d", len(data))
	}
	magic := string(data[0x02:0x0E])
	if magic != PuzMagic {
		return nil, fmt.Errorf("Bad magic: %s", magic)
	}
	var puz PuzFile

	puz.Version = string(data[0x18:0x1c])
	puz.Width = int(data[0x2c])
	puz.Height = int(data[0x2d])

	clues := make([]string, binary.LittleEndian.Uint16(data[0x2e:0x30]))

	puz.Cells = make([]Cell, puz.Width*puz.Height)
	if len(data) < 0x34+2*len(puz.Cells) {
		return nil, fmt.Errorf("Data too short: len=%d", len(data))
	}
	soln := data[0x34 : 0x34+len(puz.Cells)]
	for i, ch := range soln {
		if ch == '.' {
			puz.Cells[i].Black = true
		} else {
			puz.Cells[i].Fill = string(ch)
		}
	}

	strings := stringReader{data: data[0x34+2*len(puz.Cells):]}
	puz.Title = strings.next()
	puz.Author = strings.next()
	puz.Copyright = strings.next()
	for i := range clues {
		clues[i] = strings.next()
	}
	puz.Notes = strings.next()
	if strings.err != nil {
		return nil, fmt.Errorf("parsing strings: %s", strings.err.Error())
	}
	puz.assign(clues)

	if err := readExtraSections(&puz, strings.data); err != nil {
		return nil, err
	}

	return &puz, nil
}

const (
	ExtraSectionHeaderLen   = 8
	gextPreviouslyIncorrect = 0x10
	gextIncorrect           = 0x20
	gextProvided            = 0x40
	gextCircled             = 0x80
)

func readExtraSections(puz *PuzFile, data []byte) error {
	var rebusIndices []byte
	var rebusAnswers map[int]string

	for len(data) > 0 {
		if len(data) < ExtraSectionHeaderLen {
			return fmt.Errorf("bad section header: too short (len=%d)", len(data))
		}
		name := string(data[:4])
		dlen := int(binary.LittleEndian.Uint16(data[4:6]))
		if len(data) < ExtraSectionHeaderLen+dlen {
			return fmt.Errorf("bad section header (%s): length longer than data", name)
		}
		section := data[ExtraSectionHeaderLen : ExtraSectionHeaderLen+dlen]
		data = data[ExtraSectionHeaderLen+dlen+1:]

		switch name {
		case "GRBS":
			if len(section) != puz.Width*puz.Height {
				return fmt.Errorf("GRBS: bad data length")
			}
			rebusIndices = section
		case "RTBL":
			rebusAnswers = make(map[int]string)
			txt := string(section)
			if txt[len(txt)-1] == ';' {
				txt = txt[:len(txt)-1]
			}
			rebi := strings.Split(txt, ";")
			for _, rebus := range rebi {
				bits := strings.SplitN(rebus, ":", 2)
				if len(bits) != 2 {
					return fmt.Errorf("bad RTBL entry: %q", rebus)
				}
				if len(bits[0]) > 0 && bits[0][0] == ' ' {
					bits[0] = bits[0][1:]
				}
				n, err := strconv.ParseInt(bits[0], 10, 32)
				if err != nil {
					return fmt.Errorf("bad RTBL entry: %q", rebus)
				}
				rebusAnswers[int(n)] = bits[1]
			}
		case "GEXT":
			if len(section) != puz.Width*puz.Height {
				return fmt.Errorf("GEXT: bad data length")
			}
			for i, flags := range section {
				if flags&gextCircled != 0 {
					puz.Cells[i].Circled = true
				}
			}
		default:
		}
	}
	if rebusAnswers != nil && rebusIndices != nil {
		for i, off := range rebusIndices {
			if off == 0 {
				continue
			}
			if puz.Cells[i].Black {
				return fmt.Errorf("Black cell has a rebus")
			}
			ans, ok := rebusAnswers[int(off)-1]
			if !ok {
				return fmt.Errorf("Missing rebus: %d", off-1)
			}
			puz.Cells[i].Fill = ans
		}
	}
	return nil
}

func FromFile(path string) (*PuzFile, error) {
	bytes, err := ioutil.ReadFile(path)
	if err != nil {
		return nil, err
	}
	return FromBytes(bytes)
}

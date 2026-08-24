package formats

import (
	"os"
	"strings"
	"testing"
)

func TestDispatch(t *testing.T) {
	for _, path := range []string{
		"../puz/testdata/av110622.puz",
		"../jpz/testdata/mini.jpz",
		"../jpz/testdata/mini.xml",
	} {
		data, err := os.ReadFile(path)
		if err != nil {
			t.Fatal(err)
		}
		if _, err := Parse(data); err != nil {
			t.Errorf("Parse(%s): %v", path, err)
		}
	}

	_, err := Parse([]byte("not a puzzle at all"))
	if err == nil || !strings.Contains(err.Error(), "unrecognized puzzle format") {
		t.Errorf("garbage input: got err=%v", err)
	}
}

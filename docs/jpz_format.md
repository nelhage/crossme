# The .jpz (Crossword Compiler XML) format

`.jpz` is the interchange format of [Crossword Compiler], originally
built for its Java solving applet. It is the common distribution
format for puzzles that the binary `.puz` format cannot express —
AVCX and many indie constructors publish in it. The format is
specified by an XSD at <https://crossword.info/xml/rectangular-puzzle.xsd>.

## Container

A `.jpz` file is usually a **zip archive containing a single XML
document**, but files are sometimes distributed as the bare XML.
CrossMe's parser (the `jpz` package) accepts both, sniffing the zip
magic. The XML declares an encoding; UTF-8 and Latin-1/Windows-1252
are handled (files labeled ISO-8859-1 are decoded as Windows-1252,
since real files routinely contain 1252 smart quotes).

## Document structure

```xml
<crossword-compiler-applet>          <!-- or <crossword-compiler>, or no wrapper -->
  <applet-settings .../>             <!-- applet chrome; ignored -->
  <rectangular-puzzle>
    <metadata>
      <title/> <creator/> <copyright/> <description/>
    </metadata>
    <crossword>
      <grid width="15" height="15">
        <cell x="1" y="1" solution="A" number="1"/>
        <cell x="5" y="1" type="block"/>
        <cell x="3" y="3" solution="M" background-shape="circle"/>
        <cell x="2" y="1" solution="HEART"/>   <!-- rebus: multi-char solution -->
      </grid>
      <word id="1" x="1-4" y="1"/>             <!-- explicit word→cells mapping -->
      <word id="2"><cells x="1" y="1"/>...</word>
      <clues><title>Across</title>
        <clue word="1" number="1">Clue text, possibly with <b>markup</b></clue>
      </clues>
      <clues><title>Down</title>...</clues>
    </crossword>
  </rectangular-puzzle>
</crossword-compiler-applet>
```

Unlike `.puz`, everything is explicit: cells carry their own numbers,
words enumerate the cells they cover, and clues reference words by id.

## What CrossMe supports (phase 1)

The parser maps standard crosswords onto the same in-memory
representation as the `.puz` reader:

- blocks, cell numbers, circled cells
- rebus entries (multi-character `solution` attributes)
- Across/Down clue lists; inline clue markup is flattened to plain text
- metadata (title, creator, copyright, description + instructions)

Anything the current `Puzzle` proto cannot faithfully represent is
**rejected with an explicit error** rather than imported lossily:
barred grids, shaded (`background-color`) cells, void and in-grid clue
cells, clue lists other than Across/Down, words that are not straight
across/down runs, non-standard numbering, and the non-crossword puzzle
types the schema allows (coded, word search, sudoku, acrostic).

The original upload bytes are retained in the `puz_files` table
(keyed by sha256, exactly as for `.puz` uploads), so already-imported
puzzles can be re-parsed if support for more of the format is added
later.

[Crossword Compiler]: https://www.crossword-compiler.com/en/help/html/XML.htm

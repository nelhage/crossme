import { Puzzle, Cell } from "./types";

const puzzle: Puzzle = Object.freeze({
  title:
    'February 27, 2019  - "Ancient Capitals" - Anna Gundlach, edited by Ben Tausig',
  author: "Anna Gundlach",
  copyright: "",
  width: 15,
  height: 15,
  date: "",
  squares: [
    { black: false, fill: "Y", number: 1 },
    { black: false, fill: "A", number: 2 },
    { black: false, fill: "M", number: 3 },
    { black: true },
    { black: false, fill: "I", number: 4 },
    { black: false, fill: "N", number: 5 },
    { black: false, fill: "D", number: 6 },
    { black: false, fill: "E", number: 7 },
    { black: false, fill: "B", number: 8 },
    { black: false, fill: "T", number: 9 },
    { black: true },
    { black: false, fill: "A", number: 10 },
    { black: false, fill: "C", number: 11 },
    { black: false, fill: "M", number: 12 },
    { black: false, fill: "E", number: 13 },
    { black: false, fill: "O", number: 14 },
    { black: true },
    { black: false, fill: "S", number: 15 },
    { black: true },
    { black: false, fill: "M", number: 16 },
    { black: false, fill: "M", number: 17 },
    { black: false, fill: "E", number: 18 },
    { black: true },
    { black: false, fill: "A", number: 19 },
    { black: false, fill: "A", number: 20 },
    { black: true },
    { black: true },
    { black: true },
    { black: false, fill: "D", number: 21 },
    { black: false, fill: "V", number: 22 },
    { black: true },
    { black: false, fill: "S", number: 23 },
    { black: false, fill: "M", number: 24 },
    { black: false, fill: "A", number: 25 },
    { black: false, fill: "U", number: 26 },
    { black: false, fill: "R", number: 27 },
    { black: false, fill: "G", number: 28 },
    { black: false, fill: "A", number: 29 },
    { black: true },
    { black: true },
    { black: false, fill: "S", number: 30 },
    { black: true },
    { black: false, fill: "C", number: 31 },
    { black: true },
    { black: true },
    { black: true },
    { black: false, fill: "N", number: 32 },
    { black: false, fill: "O", number: 33 },
    { black: true },
    { black: false, fill: "P", number: 34 },
    { black: true },
    { black: true },
    { black: true },
    { black: false, fill: "B", number: 35 },
    { black: false, fill: "W", number: 36 },
    { black: true },
    { black: true },
    { black: true },
    { black: false, fill: "S", number: 37 },
    { black: true },
    { black: false, fill: "E", number: 38 },
    { black: true },
    { black: true },
    { black: true },
    { black: false, fill: "A", number: 39 },
    { black: true },
    { black: false, fill: "B", number: 40 },
    { black: true },
    { black: true },
    { black: false, fill: "R", number: 41 },
    { black: false, fill: "P", number: 42 },
    { black: false, fill: "M", number: 43 },
    { black: false, fill: "B", number: 44 },
    { black: false, fill: "T", number: 45 },
    { black: false, fill: "R", number: 46 },
    { black: false, fill: "S", number: 47 },
    { black: false, fill: "R", number: 48 },
    { black: true },
    { black: false, fill: "S", number: 49 },
    { black: true },
    { black: true },
    { black: true },
    { black: false, fill: "O", number: 50 },
    { black: false, fill: "E", number: 51 },
    { black: false, fill: "S", number: 52 },
    { black: true },
    { black: false, fill: "W", number: 53 },
    { black: false, fill: "R", number: 54 },
    { black: false, fill: "H", number: 55 },
    { black: false, fill: "O", number: 56 },
    { black: false, fill: "V", number: 57 },
    { black: true },
    { black: false, fill: "E", number: 58 },
    { black: true },
    { black: false, fill: "G", number: 59 },
    { black: false, fill: "A", number: 60 },
    { black: true },
    { black: false, fill: "R", number: 61 },
    { black: true },
    { black: false, fill: "S", number: 62 }
  ] as Cell[],
  down_clues: [
    {
      number: 1,
      text: "Kind of joke heard in the Dozens"
    },
    {
      number: 2,
      text: "Mythological beefcake"
    },
    {
      number: 3,
      text: "Site of the Prophet's Mosque"
    },
    {
      number: 4,
      text:
        "Thing you might have to zoom all the way in on to see with Google Earth"
    },
    {
      number: 5,
      text: "Turner who led an 1831 slave rebellion"
    },
    {
      number: 6,
      text: "Ma\u00f1ana, por ejemplo"
    },
    {
      number: 7,
      text: "Joint shape"
    },
    {
      number: 8,
      text: "How some 1960s fictional space explorers went"
    },
    {
      number: 9,
      text: '"You wanna fight??"'
    },
    {
      number: 10,
      text: "Reddit Q&A"
    },
    {
      number: 11,
      text: "One buying"
    },
    {
      number: 12,
      text: '"(I\'m Not Your) Steppin\' Stone" band, with "the"'
    },
    {
      number: 13,
      text: '"Me me me me me" type'
    },
    {
      number: 18,
      text: "Genre for Hawthorne Heights"
    },
    {
      number: 22,
      text: "Clear out"
    },
    {
      number: 25,
      text: "Out from under the covers"
    },
    {
      number: 26,
      text: "Well-versed in"
    },
    {
      number: 27,
      text: "Team from New York or Texas"
    },
    {
      number: 28,
      text: "Stuck, in a way"
    },
    {
      number: 32,
      text: "Study aid for a student writing an essay the night before it's due"
    },
    {
      number: 33,
      text: "Invasive daisies"
    },
    {
      number: 34,
      text: "Reduce, as one's sentence?"
    },
    {
      number: 35,
      text: "Was part of the club"
    },
    {
      number: 36,
      text: "Legal order"
    },
    {
      number: 37,
      text: "Fruity liqueur"
    },
    {
      number: 39,
      text: "OTC HSV-1 treatment"
    },
    {
      number: 40,
      text:
        "Gross candy flavor that doesn't taste like the fruit it references, and yet which somehow remains inexplicably popular"
    },
    {
      number: 41,
      text: "Puts a new price on"
    },
    {
      number: 42,
      text: "Get ready for a group presentation, maybe"
    },
    {
      number: 43,
      text:
        "Active volcano where the borders of ten municipalities meet at the summit"
    },
    {
      number: 45,
      text: "Cellular network structure"
    },
    {
      number: 46,
      text: 'Cage has two in "Adaptation"'
    },
    {
      number: 47,
      text: "Mathematical total"
    },
    {
      number: 52,
      text: "College apartment after a party, probably"
    },
    {
      number: 54,
      text: "Some GPS displays"
    },
    {
      number: 55,
      text: '"Well whaddaya know ..."'
    },
    {
      number: 56,
      text: "Hard rock that might be the source of heavy metal"
    }
  ],
  across_clues: [
    {
      number: 1,
      text: "Starchy side"
    },
    {
      number: 4,
      text: "Like many college grads"
    },
    {
      number: 10,
      text: "Supplier of Tornado Seeds"
    },
    {
      number: 14,
      text: "Elevated address"
    },
    {
      number: 15,
      text: '"___ Moon"'
    },
    {
      number: 16,
      text: "Producer of the Opus 3 and Mother-32 synths"
    },
    {
      number: 17,
      text: "Number of people walking down the runway at Fashion Week?"
    },
    {
      number: 19,
      text: "AD part"
    },
    {
      number: 20,
      text: "15-Across genre"
    },
    {
      number: 21,
      text: "Place with long waits, in clich\u00e9d standup"
    },
    {
      number: 23,
      text: "Compete in the Nordic combined"
    },
    {
      number: 24,
      text: "Intramural softball clubs for bull-human hybrids?"
    },
    {
      number: 29,
      text: "Pretty-picture middle"
    },
    {
      number: 30,
      text: 'Word in a plea at the end of "The Price Is Right"'
    },
    {
      number: 31,
      text: "Body with a tail that astronomers look for"
    },
    {
      number: 32,
      text: "In sleep mode, say"
    },
    {
      number: 34,
      text: "Cuts (down)"
    },
    {
      number: 35,
      text: "What Creed uses to hydrate between rounds?"
    },
    {
      number: 37,
      text: "Feast with four questions and four glasses of wine"
    },
    {
      number: 38,
      text: "Placed a Q anywhere in this crossword, e.g."
    },
    {
      number: 39,
      text: "Metal medley"
    },
    {
      number: 40,
      text: "Cutting-edge ceremony?"
    },
    {
      number: 41,
      text: "It's often 45 for a 7\""
    },
    {
      number: 44,
      text:
        "Where to park yourself for a sampler at the local craft distillery?"
    },
    {
      number: 48,
      text: 'Kylo of "Star Wars"'
    },
    {
      number: 49,
      text: "Kylo, to Han and Leia"
    },
    {
      number: 50,
      text: "Navel variety"
    },
    {
      number: 51,
      text: "Male seahorses carry them"
    },
    {
      number: 53,
      text: "One-stop shop for discount pictures of soup cans, Elvis, etc.?"
    },
    {
      number: 57,
      text: "___ Cong"
    },
    {
      number: 58,
      text: "Stick through"
    },
    {
      number: 59,
      text: "Rev, as an engine"
    },
    {
      number: 60,
      text: "Conan's cohost"
    },
    {
      number: 61,
      text: "Anaphylactic reactions"
    },
    {
      number: 62,
      text: "Place to chill out while you heat up"
    }
  ]
});

export default puzzle;

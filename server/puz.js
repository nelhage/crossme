PuzFile = function (buffer) {
  this.buffer = buffer;
  this.parse();
};

function StringReader(buffer) {
  this.buffer = buffer;
}

StringReader.prototype.nextString = function() {
  var off = 0;
  for (off = 0; off < this.buffer.length; off++) {
    if (this.buffer[off] == 0)
      break;
  }
  var str = this.buffer.toString('ascii', 0, off);
  this.buffer = this.buffer.slice(off + 1);
  return str;
}

PuzFile.prototype.parse = function () {
  this.magic = this.buffer.toString('utf8', 0x02, 0x0D);
  if (this.magic !== "ACROSS&DOWN") {
    throw new Error("Invalid magic!");
  }
  this.version = this.buffer.toString('utf8', 0x18, 0x1B);
  this.width   = this.buffer.readUInt8(0x2C);
  this.height  = this.buffer.readUInt8(0x2D);
  this.num_clues = this.buffer.readUInt16LE(0x2E);
  var off = 0x34;
  off = this.read_board(off);
  this.read_strings(off);
  this.assign_numbers();
}

PuzFile.prototype.read_board = function (off) {
  var solution_data = this.buffer.slice(off, off + this.width * this.height);
  this.solution = [];
  var i = 0;
  for (var r = 0; r < this.height; r++) {
    var row = []
    for (var c = 0; c < this.width; c++) {
      var cell = solution_data[i++];
      row.push((cell === '.'.charCodeAt(0)) ? null : String.fromCharCode(cell));
    }
    this.solution.push(row);
  }

  return off + 2*this.width*this.height;
}

PuzFile.prototype.read_strings = function(off) {
  var reader = new StringReader(this.buffer.slice(off));
  this.title = reader.nextString();
  this.author = reader.nextString();
  this.copyright = reader.nextString();
  this.all_clues = []
  for (var i = 0; i < this.num_clues; i++) {
    this.all_clues.push(reader.nextString());
  }
  this.note = reader.nextString();
}

PuzFile.prototype._needs_across_number = function (r, c) {
  if (c == 0 || this.solution[r][c - 1] === null) {
    return (c + 1 !== this.width && this.solution[r][c + 1] !== null)
  }
  return false;
}

PuzFile.prototype._needs_down_number = function (r, c) {
  if (r == 0 || this.solution[r - 1][c] === null) {
    return (r + 1 !== this.height && this.solution[r + 1][c] !== null)
  }
  return false;
}

PuzFile.prototype.assign_numbers = function() {
  this.numbers = [];
  this.down_clues = [];
  this.across_clues = [];

  var number = 1, clue_index = 0;
  for (var r = 0; r < this.height; r++) {
    this.numbers.push(new Array(this.width));
    for (var c = 0; c < this.width; c++) {
      if (this.solution[r][c] === null)
        continue;
      if (this._needs_across_number(r,c)) {
        this.numbers[r][c] = number;
        this.across_clues[number] = this.all_clues[clue_index++];
      }
      if (this._needs_down_number(r,c)) {
        this.numbers[r][c] = number;
        this.down_clues[number] = this.all_clues[clue_index++];
      }
      if (this.numbers[r][c])
        number++;
    }
  }
}

if (typeof(module) !== 'undefined') {
  module.exports = PuzFile;
}

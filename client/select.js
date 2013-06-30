Template.selector.puzzles = function() {
  return Puzzles.find().fetch();
}

Template.selector.selected = function() {
  return Session.equals('puzzleid', this._id);
}

Template.selector.events({
  'click button': function() {
    var id = $('#switchpuzzle').val();
    load_puzzle(id);
  }
});

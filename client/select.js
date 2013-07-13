Template.selector.puzzles = function() {
  return Puzzles.find().fetch();
}

Template.selector.events({
  'click button': function() {
    var id = $('#switchpuzzle').val();
    Meteor.call('newGame', id, function (error, id) {
      if (!error)
        load_game(id);
    });
    $('#new-game-modal').modal('hide');
    return false;
  }
});

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

function fail(err) {
  window.the_error = err;
  alert(err);
}

function uploadFile(file) {
    var fr = new FileReader();
    fr.onerror = function() {
        fail(fr.error);
    };
    fr.onload = function() {
        Meteor.call('uploadPuzzle', fr.result, function (error, id) {
            if (error)
              return fail(error);
            Meteor.call('newGame', id, function (error, id) {
              if (error)
                return fail(error);
              load_game(id);
            });
        });
    };
    fr.readAsBinaryString(file);
}

function handleUpload() {
  var files = $('#puzfile')[0].files;
  if (!files.length)
        return fail("You must select a file.");
  uploadFile(files[0]);
}

Template.upload.events({
  'click button': function() {
    $('#new-game-modal').modal('hide');
    handleUpload();
    return false;
  }
});

Template.recentGames.games = function() {
  return Games.find({'players.userId': Meteor.userId()},
                    {
                      sort: {created: -1},
                      limit: 10
                    });
}

Template.recentGames.puzzleTitle = function() {
  return Puzzles.findOne({_id: this.puzzle}).title;
}

Template.recentGames.date = function() {
  var me = _.find(this.players, function(p) { return p.userId === Meteor.userId()});
  return me.lastSeen.toDateString();
}

Template.recentGames.events({
  'click a.game': function (evt) {
    Meteor.Router.to('/game/' + $(evt.currentTarget).data('game'));
  }
});

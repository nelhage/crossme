Router.route('/', function() {
  Session.set('gameid', null);
  Session.set('previewid', null);
}, {
  name: 'root',
});

Router.route('/game/:id', function() {
  Session.set('gameid', this.params.id);
  Session.set('previewid', null);
  return null;
}, {
  name: 'game',
});

Router.route('/preview/:id', function() {
  Session.set('gameid', null);
  Session.set('previewid', this.params.id);
  return null;
}, {
  name: 'preview',
});

/*
Meteor.Router.add({
  '/': { as: 'root', and: function (id) {
    Session.set('gameid', null);
    Session.set('previewid', null);
  }},
  '/game/:id': {as: 'game', and: function (id) {
    Session.set('gameid', id);
    Session.set('previewid', null);
    return null;
  }},
  '/preview/:id': {as: 'preview', and: function (id) {
    Session.set('gameid', null);
    Session.set('previewid', id);
    return null;
  }}
});
*/
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

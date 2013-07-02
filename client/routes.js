Meteor.Router.add({
  '/game/:id': {as: 'game', and: function (id) {
    Session.set('gameid', id);
    return null;
  }}
});

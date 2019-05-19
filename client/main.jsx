import { Meteor } from 'meteor/meteor';

function maybePing() {
  if (Meteor.userId() && Session.get('gameid')) {
    Meteor.call('ping', Session.get('gameid'));
  }
}

Meteor.startup(function() {
  Meteor.setInterval(maybePing, 30 * 1000);
  maybePing();
});

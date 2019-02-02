/* global AccountsGuest */
Meteor.startup(function() {
  AccountsGuest.anonymous = true;
});

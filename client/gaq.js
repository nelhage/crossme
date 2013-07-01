Template.gaq.show = function() {
  return Meteor.settings &&
    Meteor.settings.public &&
    Meteor.settings.public.analytics &&
    !!Meteor.settings.public.analytics.id;
}

Template.gaq.settings = function() {
  return Meteor.settings.public.analytics;
}

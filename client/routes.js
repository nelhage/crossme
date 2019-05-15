/* global FlowRouter */

FlowRouter.route('/', {
  action() {
    Session.set('gameid', null);
    Session.set('previewid', null);
  },
  name: 'root',
});

FlowRouter.route('/game/:id', {
  action(params) {
    Session.set('gameid', params.id);
    Session.set('previewid', null);
  },
  name: 'game',
});

FlowRouter.route('/preview/:id', {
  action(params) {
    Session.set('gameid', null);
    Session.set('previewid', params.id);
  },
  name: 'preview',
});

import React from 'react';

import { render } from 'react-dom';
import App from '../imports/components/app.jsx';

/* global FlowRouter */

FlowRouter.route('/', {
  action() {
    render(
      <App />,
      document.getElementById('app'));
  },
  name: 'root',
});

FlowRouter.route('/game/:id', {
  action(params) {
    render(
      <App
        gameId={params.id}
      />,
      document.getElementById('app'));
  },
  name: 'game',
});

FlowRouter.route('/preview/:id', {
  action(params) {
    render(
      <App puzzleId={params.id} />,
      document.getElementById('app'));
  },
  name: 'preview',
});

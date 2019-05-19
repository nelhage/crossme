import React from 'react';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { render } from 'react-dom';

import App from '../imports/components/app.jsx';
import handleUpload from '../imports/ui/upload.jsx';

/* global Games */

Tracker.autorun(() => {
  Meteor.subscribe('puzzles');
  const gameId = Session.get('gameid');
  if (gameId) {
    Meteor.subscribe('game', gameId);
  }
  const preview = Session.get('previewid');
  if (preview) {
    Meteor.subscribe('puzzle', preview);
  }
  let puzzleId = preview;
  if (gameId && !puzzleId) {
    const game = Games.findOne({ _id: gameId });
    if (game) {
      puzzleId = game.puzzle;
    }
  }
  render(
    <App
      onUpload={handleUpload}
      currentUser={Meteor.user()}
      puzzleId={puzzleId}
      gameId={gameId}
    />,
    document.getElementById('app'));
});


function maybePing() {
  if (Meteor.userId() && Session.get('gameid')) {
    Meteor.call('ping', Session.get('gameid'));
  }
}

Meteor.startup(function() {
  Meteor.setInterval(maybePing, 30 * 1000);
  maybePing();
});

var fillCache = {};

function cacheEntry(square, game) {
  if (!(square in fillCache))
    fillCache[square] = {};
  if (!(game in fillCache[square]))
    fillCache[square][game] = { _id: null, dep: new Deps.Dependency() };
  return fillCache[square][game];
}

// dep = new Deps.Dependency;
// dep.depend()
// dep.changed()

var handle = Fills.find().observe({
  added: function(fill) {
    var ent = cacheEntry(fill.square, fill.game);
    ent._id = fill._id;
    ent.dep.changed();
  },
  changed: function(newFill, oldFill) {
    if (newFill.square !== oldFill.square ||
        newFill.game !== oldFill.game) {
            console.log("wtf? ", oldFill, newFill);
      }
  },
  removed: function(oldFill) {
    var ent = cacheEntry(oldFill.square, oldFill.game);
    ent._id = null;
    ent.dep.changed();
    if (!ent.dep.hasDependents()) {
      delete fillCache[oldFill.square][oldFill.game];
    }
  }
});

findFill = function findFill(square, game) {
  var ent = cacheEntry(square, game);
  ent.dep.depend();
  if (ent._id === null)
    return null;
  return Fills.findOne(ent._id);
}

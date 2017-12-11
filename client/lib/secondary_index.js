/* eslint-disable */

SecondaryIndex = function(collection, fields) {
  this.collection = collection;
  this.fieldList = fields;
  this.cache = {}
  this.handle = this.collection.find().observe({
      added: _.bind(function(obj) {
        this._added(obj);
      }, this),
      changed: _.bind(function(n, old) {
        this._removed(old);
        this._added(n);
      }, this),
      removed: _.bind(function(old) {
        this._removed(old);
      }, this),
  });
}

SecondaryIndex.prototype._added = function(o) {
  var ent = this.cacheEntry(o);
  ent._id = o._id;
  ent.dep.changed();
}

SecondaryIndex.prototype._removed = function(o) {
  var ent = this.cacheEntry(o);
  ent._id = null;
  ent.dep.changed();
  if (!ent.dep.hasDependents()) {
    delete this.cache[this.cacheKey(o)];
  }
}

SecondaryIndex.prototype.cacheKey = function(object) {
  return JSON.stringify(_.map(this.fieldList, function(f) {
      return object[f];
  }));
}

SecondaryIndex.prototype.cacheEntry = function(obj) {
  var key = this.cacheKey(obj);
  if (!(key in this.cache)) {
    this.cache[key] = { _id: null, dep: new Deps.Dependency() };
  }
  return this.cache[key];
}

SecondaryIndex.prototype.find = function(q) {
  var ent = this.cacheEntry(q);
  ent.dep.depend();
  if (ent._id === null)
    return null;
  return this.collection.findOne(ent._id);
}

/* eslint-disable */

Package.describe({
  summary: "CrossMe npm dependencies"
});

Npm.depends({"iconv": "2.2.1"});

Package.on_use(function (api, where) {
  api.add_files('index.js', ['server']);
  api.export('Iconv', 'server');
});

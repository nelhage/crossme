var nodeCrypto = require("crypto");
global.crypto = {
  getRandomValues: function(buffer: T) {
    return nodeCrypto.randomFillSync(buffer);
  }
};

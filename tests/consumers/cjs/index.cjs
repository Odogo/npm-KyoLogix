const assert = require("node:assert/strict");

const lib = require("kyologix");

assert.ok(lib, "CJS require should return an object");
assert.equal(typeof lib, "object");

console.log("CJS consumer OK");
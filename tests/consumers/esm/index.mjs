import assert from "node:assert/strict";

import * as lib from "kyologix";

assert.ok(lib, "ESM import should return a namespace object");
assert.equal(typeof lib, "object");

console.log("ESM consumer OK");

const assert=require('node:assert/strict');
const fs=require('node:fs');
assert.equal(fs.readFileSync('web/index.html','utf8'),fs.readFileSync('web/artworks/nyc/index.html','utf8'),'Homepage and project entrypoints must expose the same controls to shared scripts');

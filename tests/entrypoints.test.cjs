const assert=require('node:assert/strict');
const fs=require('node:fs');
assert.equal(fs.readFileSync('dist/index.html','utf8'),fs.readFileSync('dist/projects/ASCII/nyc/index.html','utf8'),'Homepage and project entrypoints must expose the same controls to shared scripts');

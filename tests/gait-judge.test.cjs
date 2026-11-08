const assert=require('node:assert/strict');
const {judge}=require('../scripts/gait/judge.cjs');
const current=judge(require('../dist/projects/ASCII/nyc/pedestrian-rig.js'));
assert(current.passed,current.failures.join('\n'));
const rejected=judge(require('../dist/gait-study/rejected-rig.js'));
assert(!rejected.passed,'Harness must reject the visually rejected implementation');
assert(rejected.failures.some(f=>f.includes('boundaryJumpCm')),'Must detect the actual support-switch discontinuity, not just arbitrary differences');
console.log('PASS: nine body/stride combinations satisfy continuity, stable torso and head, fixed bones and opposing arms; rejected baseline correctly fails.');

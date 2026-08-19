const fs = require('fs');
const vm = require('vm');
const g = {};
vm.runInNewContext(fs.readFileSync('oll-cases-data.js', 'utf8'), g);
vm.runInNewContext(fs.readFileSync('oll-cases.js', 'utf8'), g);
vm.runInNewContext(fs.readFileSync('lessons.js', 'utf8'), g);

const O = g.CubeOLL;
let bad = 0;
O.cases.forEach(c => {
  if (!c.id || !c.cat || !c.title?.en || !c.title?.ko || !c.tips?.en || !c.tips?.ko || !c.alg) bad++;
  if (!O.cats.find(x => x.id === c.cat)) bad++;
});
console.log('cases', O.cases.length, 'invalid', bad);
O.cats.forEach(cat => console.log(cat.id, O.byCat(cat.id).length));
console.log('twoLookEdges', O.twoLookEdges.length);
console.log('lessons en', g.CubeLessons.oll.en.length);
['Uw2', "r U R' U R U2 r'", "F R U R' U' F'"].forEach(a => console.log(a, '->', O.toCubejsAlg(a)));
process.exit(bad || O.cases.length !== 57 ? 1 : 0);

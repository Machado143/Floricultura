const test = require('node:test');
const assert = require('node:assert/strict');

const { buildSuggestionConnections, parseSuggestionIds } = require('./produtoService');

test('separa IDs de sugestões mantendo apenas valores preenchidos', () => {
  assert.deepEqual(parseSuggestionIds('a, b,, c '), ['a', 'b', 'c']);
});

test('monta conexões de sugestões para Prisma', () => {
  assert.deepEqual(buildSuggestionConnections(['p1', 'p2']), [
    { sugestao: { connect: { id: 'p1' } } },
    { sugestao: { connect: { id: 'p2' } } }
  ]);
});
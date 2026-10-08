const test = require('node:test');
const assert = require('node:assert/strict');

const { classifyStock, startOfToday, startOfMonth } = require('./dashboardService');

test('classifica estoque zerado, baixo e normal pelo limite configurado', () => {
  assert.equal(classifyStock(0), 'ZERADO');
  assert.equal(classifyStock(5), 'BAIXO');
  assert.equal(classifyStock(6), 'NORMAL');
});

test('calcula o início do dia e do mês no horário de Brasília', () => {
  const today = startOfToday();
  const month = startOfMonth();
  const expectedLocalDate = new Date(Date.now() - 3 * 60 * 60 * 1000);

  assert.equal(today.toISOString().slice(11, 19), '03:00:00');
  assert.equal(today.getUTCDate(), expectedLocalDate.getUTCDate());
  assert.equal(month.toISOString().slice(11, 19), '03:00:00');
  assert.equal(month.getUTCDate(), 1);
  assert.equal(month.getUTCMonth(), today.getUTCMonth());
});
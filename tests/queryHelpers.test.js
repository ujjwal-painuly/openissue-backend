import test from 'node:test';
import assert from 'node:assert/strict';
import { buildIssueFilter, escapeRegex, parsePagination } from '../src/utils/queryHelpers.js';
import { AppError } from '../src/utils/AppError.js';

test('escapeRegex treats special characters as plain text', () => {
  assert.equal(escapeRegex('fix [login].js'), 'fix \\[login\\]\\.js');
});

test('parsePagination calculates skip and rejects unsafe limits', () => {
  assert.deepEqual(parsePagination('3', '20'), { page: 3, limit: 20, skip: 40 });
  assert.throws(() => parsePagination(1, 500), AppError);
});

test('buildIssueFilter adds supported filters and literal text search', () => {
  const filter = buildIssueFilter({ status: 'OPEN', priority: 'HIGH', q: 'login.*' });

  assert.equal(filter.status, 'OPEN');
  assert.equal(filter.priority, 'HIGH');
  assert.equal(filter.$or[0].title.$regex, 'login\\.\\*');
});

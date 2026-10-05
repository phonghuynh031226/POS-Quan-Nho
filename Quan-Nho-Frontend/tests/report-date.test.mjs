import assert from 'node:assert/strict'
import test from 'node:test'
import { addLocalDays, formatLocalDate, parseLocalDate } from '../src/utils/localDate.js'

test('local report dates do not shift to the previous day near local midnight', () => {
  const localMidnight = new Date(2026, 9, 4, 0, 30)

  assert.equal(formatLocalDate(localMidnight), '2026-10-04')
  assert.equal(formatLocalDate(parseLocalDate('2026-10-04')), '2026-10-04')
  assert.equal(addLocalDays('2026-10-04', -1), '2026-10-03')
})

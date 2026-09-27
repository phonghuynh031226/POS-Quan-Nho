import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const optionGroupsPageUrl = new URL('../src/pages/OptionGroups/index.jsx', import.meta.url)

test('option group cards do not show the internal code badge beside the name', async () => {
  const source = await readFile(optionGroupsPageUrl, 'utf8')

  assert.doesNotMatch(source, /\{group\.code\s*&&\s*\([\s\S]*?\{group\.code\}[\s\S]*?\)\}/)
})

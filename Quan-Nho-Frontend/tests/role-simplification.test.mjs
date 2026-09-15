import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ROLES, DEMO_ACCOUNTS } from '../src/constants/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const navbarPath = path.resolve(__dirname, '../src/components/layout/Navbar.jsx')
const routesPath = path.resolve(__dirname, '../src/routes/index.jsx')

test('Only ADMIN role and single admin demo account exist', () => {
  // Check ROLES
  const roleKeys = Object.keys(ROLES)
  assert.ok(roleKeys.includes('ADMIN') || roleKeys.includes('OWNER'))
  assert.equal(ROLES.ADMIN.name, 'Chủ quán')

  // Check DEMO_ACCOUNTS
  assert.equal(DEMO_ACCOUNTS.length, 1)
  assert.equal(DEMO_ACCOUNTS[0].username, 'admin')
  assert.ok(DEMO_ACCOUNTS[0].role === 'ADMIN' || DEMO_ACCOUNTS[0].role === 'OWNER')
})

test('Navbar only contains the 5 core Owner navigation items', async () => {
  const navbarCode = await readFile(navbarPath, 'utf8')

  // Should NOT contain Kitchen or Staff navigation
  assert.equal(navbarCode.includes('/kitchen'), false)
  assert.equal(navbarCode.includes('/staff'), false)
  assert.equal(navbarCode.includes("'Pha chế'"), false)
  assert.equal(navbarCode.includes("'Nhân viên'"), false)

  // Should contain the 5 core paths
  assert.equal(navbarCode.includes("to: '/pos'"), true)
  assert.equal(navbarCode.includes("to: '/orders'"), true)
  assert.equal(navbarCode.includes("to: '/menu'"), true)
  assert.equal(navbarCode.includes("to: '/options'"), true)
  assert.equal(navbarCode.includes("to: '/reports'"), true)
})

test('Routes redirect kitchen, staff, and home to /pos', async () => {
  const routesCode = await readFile(routesPath, 'utf8')

  assert.match(routesCode, /path:\s*'kitchen'[\s\S]*?Navigate to="\/pos"/)
  assert.match(routesCode, /path:\s*'staff'[\s\S]*?Navigate to="\/pos"/)
  assert.match(routesCode, /return <Navigate to="\/pos" replace \/>/)
})

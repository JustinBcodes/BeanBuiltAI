const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
const Stripe = require('stripe')

function load(relative, mocks = {}, env = {}) {
  const filename = path.resolve(__dirname, '..', relative)
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText
  const module = { exports: {} }
  vm.runInNewContext(code, { module, exports: module.exports, require: name => name in mocks ? mocks[name] : require(name), process: { env }, URL, Buffer, TextDecoder, Uint8Array, console }, { filename })
  return module.exports
}
const env = { NEXTAUTH_URL: 'https://beanbuilt.example', STRIPE_SECRET_KEY: 'sk_test_dummy', STRIPE_WEBHOOK_SECRET: 'whsec_test', STRIPE_PRICE_ID: 'price_pro' }
const tools = load('src/lib/pro-tools.ts')
const session = { user: { id: 'owner', email: 'owner@example.com' } }
const security = load('src/lib/api-security.ts', {}, env)

test('grocery list groups repeated ingredients without summing incompatible quantities', () => {
  const meal = ingredients => ({ name: 'Lunch', ingredients })
  const result = tools.groceryList({ multiWeekMealPlans: [{ monday: { meals: [meal([{ item: 'Rice', qty: '1 cup' }])] }, tuesday: { meals: [meal([{ item: ' rice ', qty: '100 g' }])] } }] }, 0)
  assert.equal(result.length, 1)
  assert.equal(result[0].quantities.join(' + '), '1 cup + 100 g')
  assert.equal(result[0].meals.length, 1)
})

test('calendar rejects invalid dates, excludes rest days, escapes text and folds UTF-8 lines', () => {
  const plan = { multiWeekSchedules: [[{ dayOfWeek: 'Monday', isRestDay: false, workoutDetails: { workoutName: 'Lift, recover; repeat\nBEGIN:VEVENT', exercises: [{ name: 'é'.repeat(90), sets: 3, reps: '10', rest: '60 sec' }] } }, { dayOfWeek: 'Tuesday', isRestDay: true }]] }
  for (const start of ['2026-09-08', '2026-02-30', '', 'invalid']) assert.throws(() => tools.workoutCalendar(plan, 0, start, 'plan-1'))
  const calendar = tools.workoutCalendar(plan, 0, '2026-09-07', 'plan-1')
  assert.equal(calendar.match(/^BEGIN:VEVENT$/gm).length, 1)
  assert.ok(calendar.includes('DTSTART;VALUE=DATE:20260907'))
  assert.ok(calendar.includes('DTEND;VALUE=DATE:20260908'))
  assert.ok(calendar.includes('Lift\\, recover\\; repeat\\nBEGIN:VEVENT'))
  assert.ok(calendar.split('\r\n').every(line => Buffer.byteLength(line, 'utf8') <= 75))
})

test('membership cannot be granted by cached database status or a different Stripe price', async () => {
  let values = [{ status: 'active', items: { data: [{ price: { id: 'price_other' } }] } }]
  const billing = load('src/lib/billing.ts', {
    stripe: class { subscriptions = { list: async () => ({ data: values }) } },
    '@/lib/prisma': { prisma: { billingAccount: { findUnique: async () => ({ status: 'active', stripeCustomerId: 'cus_owner' }) } } },
  }, env)
  assert.equal((await billing.getMembership('owner')).pro, false)
  values = [{ status: 'past_due', items: { data: [{ price: { id: 'price_pro' } }] } }]
  assert.equal((await billing.getMembership('owner')).pro, false)
  values[0].status = 'active'
  assert.equal((await billing.getMembership('owner')).pro, true)
})

test('checkout rejects foreign origins, unsigned users, unconfigured billing and wrong price', async () => {
  let signedIn = true, configured = true
  const checkout = load('src/app/api/billing/checkout/route.ts', {
    'next-auth': { getServerSession: async () => signedIn ? session : null },
    '@/lib/auth': { authOptions: {} }, '@/lib/prisma': { prisma: {} }, '@/lib/api-security': security,
    '@/lib/billing': { billingConfigured: () => configured, PRO_PRICE_CENTS: 1200, stripeClient: () => ({ prices: { retrieve: async () => ({ active: true, currency: 'usd', unit_amount: 9900, recurring: { interval: 'month', interval_count: 1 } }) } }) },
  }, env)
  const req = origin => new Request('https://beanbuilt.example/api/billing/checkout', { method: 'POST', headers: { origin } })
  assert.equal((await checkout.POST(req('https://evil.example'))).status, 403)
  signedIn = false
  assert.equal((await checkout.POST(req('https://beanbuilt.example'))).status, 401)
  signedIn = true; configured = false
  assert.equal((await checkout.POST(req('https://beanbuilt.example'))).status, 503)
  configured = true
  assert.equal((await checkout.POST(req('https://beanbuilt.example'))).status, 503)
})

test('premium handler denies free users before reading any saved plans', async () => {
  const route = load('src/app/api/pro/tools/route.ts', {
    'next-auth': { getServerSession: async () => session }, '@/lib/auth': { authOptions: {} },
    '@/lib/billing': { getMembership: async () => ({ pro: false }) }, '@/lib/prisma': { prisma: {} },
    '@/lib/pro-tools': tools, '@/lib/validators': {},
  }, env)
  assert.equal((await route.GET(new Request('https://beanbuilt.example/api/pro/tools?action=backup'))).status, 403)
})

test('webhook verifies the raw Stripe signature and treats repeated signed events safely', async () => {
  const stripe = new Stripe('sk_test_dummy')
  const route = load('src/app/api/billing/webhook/route.ts', {
    '@/lib/prisma': { prisma: {} },
    '@/lib/billing': { billingConfigured: () => true, stripeClient: () => stripe },
    '@/lib/webhook-body': load('src/lib/webhook-body.ts'),
  }, env)
  const body = JSON.stringify({ id: 'evt_test', type: 'test.unhandled', data: { object: {} } })
  const signature = stripe.webhooks.generateTestHeaderString({ payload: body, secret: env.STRIPE_WEBHOOK_SECRET })
  const req = (sig, payload = body) => new Request('https://beanbuilt.example/api/billing/webhook', { method: 'POST', headers: { 'stripe-signature': sig }, body: payload })
  assert.equal((await route.POST(req('forged'))).status, 400)
  assert.equal((await route.POST(req(signature, body + ' '))).status, 400)
  assert.equal((await route.POST(req(signature))).status, 200)
  assert.equal((await route.POST(req(signature))).status, 200)
})

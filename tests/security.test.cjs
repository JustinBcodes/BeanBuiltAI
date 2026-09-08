const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')

// Load actual TypeScript handlers with isolated dependencies; no network or database is used.
function load(relativePath, mocks = {}) {
  const filename = path.resolve(__dirname, '..', relativePath)
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText
  const module = { exports: {} }
  vm.runInNewContext(code, {
    module, exports: module.exports,
    require: name => name in mocks ? mocks[name] : require(name),
    process: { env: { NEXTAUTH_URL: 'https://beanbuilt.example' } },
    URL, TextDecoder, Uint8Array, console,
  }, { filename })
  return module.exports
}

const security = load('src/lib/api-security.ts')
const request = (headers = {}, body) => new Request('https://beanbuilt.example/api/user/profile', {
  method: 'POST', headers: { origin: 'https://beanbuilt.example', ...headers }, body,
})

test('mutations accept same-origin and reject foreign, sibling, opaque, and absent origins', () => {
  assert.equal(security.validateMutationRequest(request()), null)
  for (const origin of ['https://evil.example', 'https://beanbuilt.example.evil.test', 'null', 'http://beanbuilt.example']) {
    assert.equal(security.validateMutationRequest(request({ origin })).status, 403)
  }
  assert.equal(security.validateMutationRequest(request({ 'sec-fetch-site': 'same-site' })).status, 403)
  const absent = request(); absent.headers.delete('origin')
  assert.equal(security.validateMutationRequest(absent).status, 403)
  absent.headers.set('sec-fetch-site', 'same-origin')
  assert.equal(security.validateMutationRequest(absent), null)
})

test('JSON reader enforces content type, parses JSON, rejects malformed and oversized actual body', async () => {
  assert.equal((await security.readJsonBody(request({ 'content-type': 'application/json' }, '{"weight":70}'))).weight, 70)
  for (const [headers, body, limit, status] of [
    [{ 'content-type': 'text/plain' }, '{}', 100, 415],
    [{ 'content-type': 'application/json' }, '{', 100, 400],
    [{ 'content-type': 'application/json' }, '"123456"', 4, 413],
  ]) {
    await assert.rejects(security.readJsonBody(request(headers, body), limit), error => security.requestErrorResponse(error)?.status === status)
  }
})

test('profile validation rejects Prisma operator injection, status tampering and invalid metrics', () => {
  const { metricProfileSchema, weightUpdateSchema } = load('src/lib/validations/profile.ts')
  assert.equal(metricProfileSchema.safeParse({ name: 'Bean', weight: 70 }).success, true)
  for (const data of [{ weight: { increment: 10 } }, { hasCompletedOnboarding: true }, { email: 'another@example.com' }, { age: 0 }, { favoriteFoods: ['x'.repeat(101)] }]) {
    assert.equal(metricProfileSchema.safeParse(data).success, false)
  }
  for (const weight of [-20, 0, Infinity, 501, '70']) assert.equal(weightUpdateSchema.safeParse({ weight }).success, false)
})

test('plan generation ignores a forged x-user-id and only queries the authenticated account', async () => {
  const seen = []
  const record = { id: 'signed-in-user', hasCompletedOnboarding: true }
  const findPlan = async args => { seen.push(args.where.userId); return { plan: { owner: 'signed-in-user' } } }
  const { POST } = load('src/app/api/plans/generate/route.ts', {
    '@/lib/api-security': security,
    '@/lib/ai-access': { authorizeAiGeneration: async () => null },
    'next-auth': { getServerSession: async () => ({ user: { id: 'signed-in-user' } }) },
    '@/lib/auth': { authOptions: {} },
    '@/lib/prisma': { prisma: {
      user: { findUnique: async args => { seen.push(args.where.id); return record } },
      workoutPlan: { findFirst: findPlan }, nutritionPlan: { findFirst: findPlan },
    } },
    '@/lib/openai': {},
  })
  const response = await POST(request({ 'x-user-id': 'victim-user' }))
  assert.equal(response.status, 200)
  assert.deepEqual(seen, ['signed-in-user', 'signed-in-user', 'signed-in-user'])
  assert.equal((await response.json()).workoutPlan.owner, 'signed-in-user')
})

test('auth callbacks reject redirect scheme/port/host changes and require verified Google email', async () => {
  const { authOptions } = load('src/lib/auth.ts', {
    'next-auth/providers/google': () => ({}),
    '@next-auth/prisma-adapter': { PrismaAdapter: () => ({}) },
    './prisma': { prisma: {} }, './env-validation': {},
  })
  const redirect = url => authOptions.callbacks.redirect({ url, baseUrl: 'https://beanbuilt.example' })
  assert.equal(await redirect('/dashboard'), 'https://beanbuilt.example/dashboard')
  for (const url of ['//evil.example', 'javascript:alert(1)', 'http://beanbuilt.example', 'https://beanbuilt.example:444', 'https://user:password@beanbuilt.example']) {
    assert.equal(await redirect(url), 'https://beanbuilt.example')
  }
  assert.equal(authOptions.cookies.sessionToken.options.domain, undefined)
  assert.equal(await authOptions.callbacks.signIn({ user: { email: 'user@example.com' }, account: { provider: 'google' }, profile: { email_verified: false } }), false)
})

test('AI quota checks membership and durably reserves before generation; errors fail closed', async () => {
  let pro = false
  let used = 0
  let transactions = 0
  let unavailable = false
  const { authorizeAiGeneration } = load('src/lib/ai-access.ts', {
    '@/lib/billing': { getMembership: async () => ({ pro }) },
    '@/lib/prisma': { prisma: { $transaction: async (callback, options) => {
      transactions++
      assert.equal(options.isolationLevel, 'Serializable')
      if (unavailable) throw new Error('database unavailable')
      return callback({ aiGenerationUsage: {
        count: async () => used,
        create: async () => { used++; return {} },
      } })
    } } },
  })
  assert.equal((await authorizeAiGeneration('user')).status, 403)
  assert.equal(transactions, 0)
  pro = true
  for (let i = 0; i < 3; i++) assert.equal(await authorizeAiGeneration('user'), null)
  assert.equal(used, 3)
  assert.equal((await authorizeAiGeneration('user')).status, 429)
  assert.equal(used, 3)
  unavailable = true
  assert.equal((await authorizeAiGeneration('user')).status, 503)
})

test('AI plans normalize to dashboard format and reject incomplete weeks and missing ingredients', () => {
  const { parseWorkoutPlan, parseNutritionPlan } = load('src/lib/ai-plan-validation.ts')
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const workout = { planName: 'Training', weeklySchedule: days.map(dayOfWeek => ({ dayOfWeek, isRestDay: true })) }
  assert.equal(parseWorkoutPlan(JSON.stringify(workout), {}).multiWeekSchedules[0].length, 7)
  assert.throws(() => parseWorkoutPlan(JSON.stringify({ ...workout, weeklySchedule: workout.weeklySchedule.slice(0, 6) }), {}))
  const meal = { mealType: 'Breakfast', name: 'Oats', ingredients: [{ item: 'Oats', qty: '40g' }], calories: 200, protein: 5, carbs: 30, fats: 3 }
  const nutrition = {
    planName: 'Meals', dailyTargets: { calories: 2000, proteinGrams: 120, carbGrams: 200, fatGrams: 70 },
    weeklyMealPlan: days.map(dayOfWeek => ({ dayOfWeek, meals: [meal] })),
  }
  const result = parseNutritionPlan(JSON.stringify(nutrition), {})
  assert.equal(result.multiWeekMealPlans[0].monday.dailyTotalCalories, 200)
  assert.equal(result.multiWeekMealPlans[0].monday.meals[0].ingredients[0].item, 'Oats')
  delete meal.ingredients
  assert.throws(() => parseNutritionPlan(JSON.stringify(nutrition), {}))
})

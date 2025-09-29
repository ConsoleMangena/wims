// Platformatic DB CORS plugin
// Allows frontend (Vite) to call the Platformatic DB REST/GraphQL endpoints
const fp = require('fastify-plugin')
const cors = require('@fastify/cors')

module.exports = fp(async function (app) {
  const originEnv = process.env.CORS_ORIGIN || 'http://localhost:5173'
  const allowList = originEnv.split(',').map((s) => s.trim())
  const credentials = process.env.CORS_CREDENTIALS === 'true'

  await app.register(cors, {
    origin(origin, cb) {
      // Allow same-origin or curl (no origin)
      if (!origin) return cb(null, true)
      const ok = allowList.includes('*') || allowList.includes(origin)
      cb(null, ok)
    },
    credentials,
  })
})

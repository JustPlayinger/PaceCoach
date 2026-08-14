const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient({ log: [] })
p.runner
  .count()
  .then((c) => {
    console.log('runner count:', c)
    process.exit(0)
  })
  .catch((e) => {
    console.error('ERR:', e.message)
    process.exit(1)
  })

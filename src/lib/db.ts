import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// 开发模式下：若缓存的实例缺少新模型（schema 更新后），则重建 client
function getDb(): PrismaClient {
  if (globalForPrisma.prisma) {
    // 检测关键模型是否存在，缺失则说明 schema 已更新但 client 实例过期
    if (!(globalForPrisma.prisma as unknown as { shoe?: unknown }).shoe) {
      try { globalForPrisma.prisma.$disconnect() } catch {}
      globalForPrisma.prisma = undefined
    } else {
      return globalForPrisma.prisma
    }
  }
  const client = new PrismaClient({ log: ['query'] })
  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = client
  return client
}

export const db = getDb()

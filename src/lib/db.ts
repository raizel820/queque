import { PrismaClient } from '@prisma/client'

// Global BigInt serialization fix for SQLite raw queries
// SQLite returns BigInt for COUNT(*) and other aggregate functions
;(globalThis as unknown as { BigInt: typeof BigInt }).BigInt = BigInt
if (typeof BigInt !== 'undefined') {
  (BigInt.prototype as unknown as Record<string, unknown>).toJSON = function () {
    return Number(this)
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
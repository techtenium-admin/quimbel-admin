import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function getPoolerSafeUrl(): string {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('DATABASE_URL is not set!')
    return ''
  }
  if (url.includes('pgbouncer=true')) return url
  const sep = url.includes('?') ? '&' : '?'
  const withPgbouncer = `${url}${sep}pgbouncer=true`
  process.env.DATABASE_URL = withPgbouncer
  return withPgbouncer
}

const datasourceUrl = getPoolerSafeUrl()

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: datasourceUrl ? { db: { url: datasourceUrl } } : undefined,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

globalForPrisma.prisma = db

let connectPromise: Promise<void> | null = null

/** Warm up pool before first query (reduces first-request latency on cold serverless). */
export async function ensureConnected(): Promise<void> {
  if (connectPromise === null) {
    connectPromise = db.$connect().catch((error) => {
      connectPromise = null
      console.error('Failed to connect to database:', error)
      throw error
    })
  }
  await connectPromise
}

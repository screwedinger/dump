import { createHmac, timingSafeEqual } from 'crypto'
import { NextResponse } from 'next/server'

const COOKIE = 'dump_session'
const tokenFor = (code: string) => createHmac('sha256', process.env.DUMP_ACCESS_CODE || 'change-me').update(`dump:${code}`).digest('hex')

export async function POST(request: Request) {
  const { code } = await request.json().catch(() => ({}))
  const expected = process.env.DUMP_ACCESS_CODE
  if (!expected || typeof code !== 'string') return NextResponse.json({ error: 'Access code is not configured' }, { status: 500 })
  const a = Buffer.from(tokenFor(code)); const b = Buffer.from(tokenFor(expected))
  if (a.length !== b.length || !timingSafeEqual(a, b)) return NextResponse.json({ error: 'WRONG CODE' }, { status: 401 })
  const response = NextResponse.json({ success: true })
  response.cookies.set(COOKIE, tokenFor(expected), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30 })
  return response
}

export async function DELETE() {
  const response = NextResponse.json({ success: true })
  response.cookies.set(COOKIE, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 })
  return response
}

import { NextResponse } from 'next/server'
import { codeHash, getRooms, saveRooms, validSlug, roomToken } from '../../../lib/rooms'

export async function GET() {
  const rooms = await getRooms()
  return NextResponse.json(rooms.map(({ codeHash: _c, ...r }) => r))
}

export async function POST(request: Request) {
  try {
    const { slug, name, code } = await request.json()
    if (typeof slug !== 'string' || typeof name !== 'string' || typeof code !== 'string' || !validSlug(slug) || name.trim().length < 1 || code.length < 1) {
      return NextResponse.json({ error: 'Invalid room details' }, { status: 400 })
    }
    const rooms = await getRooms()
    if (rooms.some(r => r.slug === slug)) return NextResponse.json({ error: 'Room already exists' }, { status: 409 })
    const room = { slug, name: name.trim().slice(0, 80), codeHash: codeHash(code), createdAt: new Date().toISOString() }
    rooms.push(room)
    await saveRooms(rooms)
    const response = NextResponse.json({ slug: room.slug, name: room.name })
    response.cookies.set(`dump_room_${room.slug}`, roomToken(room), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30 })
    return response
  } catch {
    return NextResponse.json({ error: 'Could not create room' }, { status: 500 })
  }
}

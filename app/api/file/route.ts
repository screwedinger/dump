import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { NextResponse } from 'next/server'

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

const mimeTypes: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif',
  webp: 'image/webp', avif: 'image/avif', heic: 'image/heic', heif: 'image/heif',
  bmp: 'image/bmp', svg: 'image/svg+xml',
  mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime', m4v: 'video/mp4',
  pdf: 'application/pdf', txt: 'text/plain', json: 'application/json',
}

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const key = new URL(request.url).searchParams.get('key')
    if (!key) return NextResponse.json({ error: 'File key is required' }, { status: 400 })

    const object = await client.send(new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
    }))

    if (!object.Body) return NextResponse.json({ error: 'File not found' }, { status: 404 })

    const name = key.split('/').pop() || 'file'
    const extension = name.includes('.') ? name.split('.').pop()!.toLowerCase() : ''
    const contentType = object.ContentType || mimeTypes[extension] || 'application/octet-stream'

    return new NextResponse(object.Body.transformToWebStream(), {
      headers: {
        'Content-Type': contentType,
        ...(object.ContentLength !== undefined ? { 'Content-Length': String(object.ContentLength) } : {}),
        'Content-Disposition': `inline; filename="${name.replace(/"/g, '')}"`,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('R2 file retrieval error:', error)
    return NextResponse.json({ error: 'Could not retrieve file' }, { status: 404 })
  }
}

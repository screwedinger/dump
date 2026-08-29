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

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const key = new URL(request.url).searchParams.get('key')
    if (!key) return NextResponse.json({ error: 'File key is required' }, { status: 400 })

    const object = await client.send(new GetObjectCommand({ Bucket: process.env.R2_BUCKET_NAME!, Key: key }))
    if (!object.Body) return NextResponse.json({ error: 'File not found' }, { status: 404 })

    const bytes = await object.Body.transformToByteArray()
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        'Content-Type': object.ContentType || 'application/octet-stream',
        'Content-Length': String(bytes.byteLength),
        'Content-Disposition': `inline; filename="${key.split('/').pop()?.replace(/"/g, '') || 'file'}"`,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Could not retrieve file' }, { status: 404 })
  }
}

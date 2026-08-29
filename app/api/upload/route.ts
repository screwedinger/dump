import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'

const requiredEnv = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME'] as const

function getClient() {
  const missing = requiredEnv.filter(name => !process.env[name])
  if (missing.length) throw new Error(`Missing R2 environment variables: ${missing.join(', ')}`)
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID!, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY! },
  })
}

export async function POST(request: Request) {
  try {
    const { name, type, size } = await request.json()
    if (!name || typeof name !== 'string') return NextResponse.json({ error: 'Filename is required' }, { status: 400 })
    if (size !== undefined && (typeof size !== 'number' || size < 0)) return NextResponse.json({ error: 'Invalid file size' }, { status: 400 })

    const safe = name.replace(/[^a-zA-Z0-9._()\- ]/g, '_').slice(0, 240) || 'file'
    const key = `${Date.now()}-${randomUUID()}-${safe}`
    const contentType = typeof type === 'string' && type ? type : 'application/octet-stream'
    const command = new PutObjectCommand({ Bucket: process.env.R2_BUCKET_NAME!, Key: key, ContentType: contentType })
    const url = await getSignedUrl(getClient(), command, { expiresIn: 900 })

    return NextResponse.json({ url, key, contentType })
  } catch (error) {
    console.error('R2 upload URL error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not create upload URL' }, { status: 500 })
  }
}

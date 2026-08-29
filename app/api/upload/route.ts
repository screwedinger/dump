import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'

const client = new S3Client({ region: 'auto', endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`, credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID!, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY! } })

export async function POST(request: Request) {
  try {
    const { name, type } = await request.json()
    if (!name || typeof name !== 'string') return NextResponse.json({ error: 'Filename is required' }, { status: 400 })
    const safe = name.replace(/[^a-zA-Z0-9._()\- ]/g, '_').slice(0, 240) || 'file'
    const key = `${Date.now()}-${randomUUID()}-${safe}`
    const command = new PutObjectCommand({ Bucket: process.env.R2_BUCKET_NAME!, Key: key, ContentType: type || 'application/octet-stream' })
    const url = await getSignedUrl(client, command, { expiresIn: 3600 })
    return NextResponse.json({ url, key })
  } catch { return NextResponse.json({ error: 'Could not create upload URL' }, { status: 500 }) }
}

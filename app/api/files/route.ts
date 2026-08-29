import { ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3'
import { NextResponse } from 'next/server'

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

const imageExtensions: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', avif: 'image/avif', heic: 'image/heic', heif: 'image/heif', bmp: 'image/bmp', svg: 'image/svg+xml',
}

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const result = await client.send(new ListObjectsV2Command({ Bucket: process.env.R2_BUCKET_NAME! }))
    const files = (result.Contents || []).map(object => {
      const key = object.Key!
      const name = key.split('/').pop() || key
      const extension = name.includes('.') ? name.split('.').pop()!.toLowerCase() : ''
      return {
        key,
        name,
        size: object.Size || 0,
        lastModified: object.LastModified,
        type: imageExtensions[extension] || 'application/octet-stream',
        url: `/api/file?key=${encodeURIComponent(key)}`,
      }
    })
    files.sort((a, b) => new Date(b.lastModified || 0).getTime() - new Date(a.lastModified || 0).getTime())
    return NextResponse.json(files)
  } catch {
    return NextResponse.json({ error: 'Could not list files' }, { status: 500 })
  }
}

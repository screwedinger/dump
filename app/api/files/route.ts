import { GetObjectCommand, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { NextResponse } from 'next/server'

const client = new S3Client({ region: 'auto', endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`, credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID!, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY! } })

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const result = await client.send(new ListObjectsV2Command({ Bucket: process.env.R2_BUCKET_NAME! }))
    const files = await Promise.all((result.Contents || []).map(async object => {
      const key = object.Key!
      const url = process.env.R2_PUBLIC_URL ? `${process.env.R2_PUBLIC_URL.replace(/\/$/, '')}/${key.split('/').map(encodeURIComponent).join('/')}` : await getSignedUrl(client, new GetObjectCommand({ Bucket: process.env.R2_BUCKET_NAME!, Key: key }), { expiresIn: 3600 })
      return { key, size: object.Size || 0, lastModified: object.LastModified, url, type: undefined }
    }))
    files.sort((a, b) => new Date(b.lastModified || 0).getTime() - new Date(a.lastModified || 0).getTime())
    return NextResponse.json(files)
  } catch { return NextResponse.json({ error: 'Could not list files' }, { status: 500 }) }
}

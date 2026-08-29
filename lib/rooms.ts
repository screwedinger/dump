import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { createHmac, timingSafeEqual } from 'crypto'

export type Room={slug:string;name:string;codeHash:string;createdAt:string}
const client=()=>new S3Client({region:'auto',endpoint:`https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,credentials:{accessKeyId:process.env.R2_ACCESS_KEY_ID!,secretAccessKey:process.env.R2_SECRET_ACCESS_KEY!}})
const bucket=()=>process.env.R2_BUCKET_NAME!
const hash=(code:string)=>createHmac('sha256',process.env.DUMP_ACCESS_CODE||'room-secret').update(`room:${code}`).digest('hex')
export const roomKey=(slug:string)=>`rooms/${slug}/`
export const validSlug=(s:string)=>/^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/.test(s)
export async function getRooms():Promise<Room[]>{try{const o=await client().send(new GetObjectCommand({Bucket:bucket(),Key:'rooms/_rooms.json'}));return JSON.parse(await o.Body!.transformToString())}catch{return[]}}
export async function saveRooms(rooms:Room[]){await client().send(new PutObjectCommand({Bucket:bucket(),Key:'rooms/_rooms.json',Body:JSON.stringify(rooms),ContentType:'application/json'}))}
export async function getRoom(slug:string){return(await getRooms()).find(r=>r.slug===slug)}
export function roomToken(room:Room){return createHmac('sha256',process.env.DUMP_ACCESS_CODE||'room-secret').update(`access:${room.slug}:${room.codeHash}`).digest('hex')}
export function validRoomCookie(cookie:string|undefined,room:Room){if(!cookie)return false;const a=Buffer.from(cookie),b=Buffer.from(roomToken(room));return a.length===b.length&&timingSafeEqual(a,b)}
export const codeHash=hash

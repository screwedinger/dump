'use client'

import { ChangeEvent, DragEvent, useCallback, useEffect, useRef, useState } from 'react'

const API = '/api'

type Item = { key: string; size?: number; lastModified?: string; url?: string; type?: string }

type Upload = { id: string; name: string; progress: number; state: 'uploading' | 'done' | 'error' }

function formatBytes(bytes = 0) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / 1024 ** i).toFixed(i ? 1 : 0)} ${units[i]}`
}

function fileName(key: string) { return key.split('/').pop() || key }
function isImage(item: Item) { return item.type?.startsWith('image/') || /\.(jpe?g|png|gif|webp|avif|heic)$/i.test(item.key) }

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<Item[]>([])
  const [uploads, setUploads] = useState<Upload[]>([])
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadFiles = useCallback(async () => {
    try {
      const response = await fetch(`${API}/files`, { cache: 'no-store' })
      if (!response.ok) throw new Error('Could not load files')
      setFiles(await response.json())
    } catch { /* R2 may not be configured during initial setup */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    loadFiles()
    const timer = setInterval(loadFiles, 4000)
    return () => clearInterval(timer)
  }, [loadFiles])

  const upload = async (file: File) => {
    const id = `${Date.now()}-${Math.random()}`
    setUploads(u => [...u, { id, name: file.name, progress: 0, state: 'uploading' }])
    try {
      const presign = await fetch(`${API}/upload`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: file.name, type: file.type, size: file.size }) })
      if (!presign.ok) throw new Error('Unable to prepare upload')
      const { url, key } = await presign.json()
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('PUT', url)
        if (file.type) xhr.setRequestHeader('Content-Type', file.type)
        xhr.upload.onprogress = e => e.lengthComputable && setUploads(u => u.map(x => x.id === id ? { ...x, progress: Math.round(e.loaded / e.total * 100) } : x))
        xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error('Upload failed'))
        xhr.onerror = () => reject(new Error('Upload failed'))
        xhr.send(file)
      })
      setUploads(u => u.map(x => x.id === id ? { ...x, progress: 100, state: 'done' } : x))
      await loadFiles()
    } catch {
      setUploads(u => u.map(x => x.id === id ? { ...x, state: 'error' } : x))
    }
  }

  const acceptFiles = (incoming: FileList | File[]) => Array.from(incoming).forEach(upload)
  const onChange = (e: ChangeEvent<HTMLInputElement>) => { if (e.target.files) acceptFiles(e.target.files); e.target.value = '' }
  const onDrop = (e: DragEvent) => { e.preventDefault(); setDragging(false); acceptFiles(e.dataTransfer.files) }

  useEffect(() => {
    const paste = (e: ClipboardEvent) => {
      const pasted = Array.from(e.clipboardData?.files || []).filter(f => f.type.startsWith('image/'))
      if (pasted.length) acceptFiles(pasted)
    }
    window.addEventListener('paste', paste)
    return () => window.removeEventListener('paste', paste)
  })

  const downloadAll = () => files.forEach((f, i) => setTimeout(() => { if (f.url) window.open(f.url, '_blank') }, i * 150))

  return <main className="page">
    <header className="topbar"><div className="logo">DUMP<span>.</span></div><div className="tag">SHARED FILE DROP / NO LOGIN</div></header>
    <section className="hero">
      <div><p className="eyebrow">EVERYONE&apos;S INVITED</p><h1>DROP.<br />SHARE.<br />DONE.</h1></div>
      <p className="intro">A shared corner of the internet for throwing files at your friends.</p>
    </section>
    <button className={`dropzone ${dragging ? 'dragging' : ''}`} onClick={() => inputRef.current?.click()} onDragOver={e => { e.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={onDrop}>
      <span className="plus">+</span><strong>{dragging ? 'LET GO.' : 'DROP FILES HERE'}</strong><span>or click to browse · paste images with ⌘V / Ctrl+V</span>
      <input ref={inputRef} type="file" multiple hidden onChange={onChange} />
    </button>
    {uploads.length > 0 && <section className="uploads"><div className="section-head"><h2>UPLOADING</h2><button onClick={() => setUploads([])}>CLEAR</button></div>{uploads.map(u => <div className="upload" key={u.id}><span>{u.name}</span><div className="bar"><i style={{ width: `${u.progress}%` }} /></div><b>{u.state === 'error' ? 'ERROR' : `${u.progress}%`}</b></div>)}</section>}
    <section className="library"><div className="section-head"><h2>{loading ? 'LOADING…' : `${files.length} FILE${files.length === 1 ? '' : 'S'}`}</h2><button disabled={!files.length} onClick={downloadAll}>DOWNLOAD ALL ↓</button></div>
      {files.length ? <div className="grid">{files.map(item => <a className="card" key={item.key} href={item.url || '#'} target="_blank" rel="noreferrer"><div className="preview">{isImage(item) && item.url ? <img src={item.url} alt="" loading="lazy" /> : <span className="filetype">FILE</span>}</div><div className="meta"><strong>{fileName(item.key)}</strong><span>{formatBytes(item.size)}</span></div></a>)}</div> : <div className="empty">NOTHING HERE YET.<br /><small>BE THE FIRST TO DUMP SOMETHING.</small></div>}
    </section>
    <footer><span>DUMP / PHASE 01</span><span>FILES LIVE UNTIL SOMEONE REMOVES THEM.</span></footer>
  </main>
}

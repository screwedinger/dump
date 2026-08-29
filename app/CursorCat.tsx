'use client'

import { useEffect, useRef } from 'react'
import styles from './cursor-cat.module.css'

export default function CursorCat() {
  const cat = useRef<HTMLDivElement>(null)
  const target = useRef({ x: -100, y: -100 })
  const current = useRef({ x: -100, y: -100 })

  useEffect(() => {
    const move = (e: MouseEvent) => { target.current = { x: e.clientX, y: e.clientY } }
    const onLeave = () => { if (cat.current) cat.current.style.opacity = '0' }
    const onEnter = () => { if (cat.current) cat.current.style.opacity = '1' }
    window.addEventListener('mousemove', move)
    document.documentElement.addEventListener('mouseleave', onLeave)
    document.documentElement.addEventListener('mouseenter', onEnter)
    let frame = 0
    const animate = () => {
      current.current.x += (target.current.x - current.current.x) * 0.12
      current.current.y += (target.current.y - current.current.y) * 0.12
      const dx = target.current.x - current.current.x
      const dy = target.current.y - current.current.y
      const angle = Math.max(-18, Math.min(18, dx * 0.08))
      if (cat.current) cat.current.style.transform = `translate3d(${current.current.x + 18}px,${current.current.y + 18}px,0) rotate(${angle}deg)`
      frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => { window.removeEventListener('mousemove', move); document.documentElement.removeEventListener('mouseleave', onLeave); document.documentElement.removeEventListener('mouseenter', onEnter); cancelAnimationFrame(frame) }
  }, [])

  return <div ref={cat} className={styles.cat} aria-hidden="true"><div className={styles.earLeft}/><div className={styles.earRight}/><div className={styles.face}><i className={styles.eyeLeft}/><i className={styles.eyeRight}/><i className={styles.nose}/><i className={styles.mouth}/></div><div className={styles.body}/><div className={styles.tail}/></div>
}

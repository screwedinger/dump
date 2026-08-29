'use client'

import { useEffect, useRef } from 'react'
import styles from './cursor-cat.module.css'

export default function CursorCat(){
  const ref=useRef<HTMLDivElement>(null)
  useEffect(()=>{
    const el=ref.current
    if(!el)return
    let mx=innerWidth/2,my=innerHeight/2,x=mx,y=my,raf=0,lastX=x,lastY=y
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches
    const onMove=(e:MouseEvent)=>{mx=e.clientX;my=e.clientY}
    const tick=()=>{
      const dx=mx-x,dy=my-y,dist=Math.hypot(dx,dy)
      const speed=Math.min(.18, .055+dist/1800)
      x+=dx*speed;y+=dy*speed
      const vx=x-lastX,vy=y-lastY
      const angle=Math.atan2(vy,vx)*180/Math.PI
      el.style.transform=`translate3d(${x-18}px,${y-18}px,0) rotate(${angle}deg)`
      el.dataset.moving=dist>8?'true':'false'
      lastX=x;lastY=y
      raf=requestAnimationFrame(tick)
    }
    addEventListener('mousemove',onMove,{passive:true})
    if(!reduced)raf=requestAnimationFrame(tick)
    return()=>{removeEventListener('mousemove',onMove);cancelAnimationFrame(raf)}
  },[])
  return <div ref={ref} className={styles.cat} aria-hidden="true"><span className={styles.earLeft}/><span className={styles.earRight}/><span className={styles.face}><i/><i/></span><span className={styles.body}/><span className={styles.tail}/></div>
}

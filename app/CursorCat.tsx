'use client'
import { useEffect, useRef } from 'react'
import styles from './cursor-cat.module.css'

export default function CursorCat(){
 const cat=useRef<HTMLDivElement>(null),target=useRef({x:-100,y:-100}),current=useRef({x:-100,y:-100}),last=useRef({x:-100,y:-100}),phase=useRef(0),movingRef=useRef(false)
 useEffect(()=>{const move=(e:MouseEvent)=>{target.current={x:e.clientX,y:e.clientY}}
 const tap=(e:PointerEvent)=>{if(e.pointerType==='touch'){target.current={x:e.clientX,y:e.clientY};phase.current=0;movingRef.current=true}}
 window.addEventListener('mousemove',move);window.addEventListener('pointerdown',tap);let frame=0
 const animate=()=>{const c=current.current,t=target.current,dx=t.x-c.x,dy=t.y-c.y,speed=Math.hypot(dx,dy),touch=matchMedia('(pointer:coarse)').matches,moving=touch?speed>2:speed>1.5
  if(moving){c.x+=dx*.1;c.y+=dy*.1;phase.current+=Math.min(.22,speed*.025)}else{if(!touch){c.x+=dx*.1;c.y+=dy*.1}phase.current+=.035}
  const hop=moving?Math.max(0,Math.sin(phase.current))*Math.min(13,3+speed*.07):0;const dir=t.x-last.current.x;const facing=dir<-.5?-1:dir>.5?1:(cat.current?.dataset.face==='-1'?-1:1)
  if(cat.current){cat.current.dataset.face=String(facing);cat.current.classList.toggle(styles.running,moving);cat.current.classList.toggle(styles.resting,!moving);cat.current.style.setProperty('--face',String(facing));cat.current.style.transform=`translate3d(${c.x+20}px,${c.y+18-hop}px,0)`}
  last.current={...t};frame=requestAnimationFrame(animate)};frame=requestAnimationFrame(animate)
 return()=>{window.removeEventListener('mousemove',move);window.removeEventListener('pointerdown',tap);cancelAnimationFrame(frame)}},[])
 return <div ref={cat} className={styles.cat} aria-hidden="true"><div className={styles.catSide}><div className={styles.tail}/><div className={styles.body}><i className={styles.legBack}/><i className={styles.legFront}/></div><div className={styles.face}><i className={styles.eye}/><i className={styles.nose}/><i className={styles.whiskers}/></div></div><div className={styles.catRest}><div className={styles.restTail}/><div className={styles.restHead}><i className={styles.restEarLeft}/><i className={styles.restEarRight}/><i className={styles.restEyeLeft}/><i className={styles.restEyeRight}/><i className={styles.restNose}/><i className={styles.restWhiskers}/></div><div className={styles.restBody}/></div></div>
}
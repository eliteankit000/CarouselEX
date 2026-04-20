'use client'

import { useEffect, useRef, useCallback } from 'react'

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null)
  const pos = useRef({ x: 0, y: 0 })
  const target = useRef({ x: 0, y: 0 })
  const rafRef = useRef<number>(0)

  const onMouseMove = useCallback((e: MouseEvent) => {
    target.current = { x: e.clientX, y: e.clientY }
  }, [])

  const onMouseOver = useCallback((e: MouseEvent) => {
    const el = e.target as HTMLElement
    if (el.closest('a, button, [role="button"], input, textarea, select, .cursor-expand')) {
      cursorRef.current?.classList.add('expanded')
    }
  }, [])

  const onMouseOut = useCallback((e: MouseEvent) => {
    const el = e.target as HTMLElement
    if (el.closest('a, button, [role="button"], input, textarea, select, .cursor-expand')) {
      cursorRef.current?.classList.remove('expanded')
    }
  }, [])

  useEffect(() => {
    const cursor = cursorRef.current
    if (!cursor) return

    document.body.classList.add('has-custom-cursor')

    const animate = () => {
      pos.current.x += (target.current.x - pos.current.x) * 0.15
      pos.current.y += (target.current.y - pos.current.y) * 0.15
      cursor.style.left = `${pos.current.x}px`
      cursor.style.top = `${pos.current.y}px`
      rafRef.current = requestAnimationFrame(animate)
    }

    window.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseover', onMouseOver)
    document.addEventListener('mouseout', onMouseOut)
    rafRef.current = requestAnimationFrame(animate)

    return () => {
      document.body.classList.remove('has-custom-cursor')
      window.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseover', onMouseOver)
      document.removeEventListener('mouseout', onMouseOut)
      cancelAnimationFrame(rafRef.current)
    }
  }, [onMouseMove, onMouseOver, onMouseOut])

  return <div ref={cursorRef} className="custom-cursor hidden md:block" data-testid="custom-cursor" />
}

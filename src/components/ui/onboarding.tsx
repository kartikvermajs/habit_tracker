'use client'

import React, { useEffect, useState, useRef } from 'react'
import gsap from 'gsap'
import { motion } from 'framer-motion'

export function Onboarding() {
  const [show, setShow] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const slide1Ref = useRef<HTMLDivElement>(null)
  const slide2Ref = useRef<HTMLDivElement>(null)
  const slide3Ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const hasSeen = localStorage.getItem('hasSeenOnboarding')
    const isMobile = window.innerWidth < 768

    if (hasSeen === 'true' || !isMobile) {
      return
    }

    setShow(true)
  }, [])

  useEffect(() => {
    if (!show) return

    const tl = gsap.timeline({
      onComplete: () => {
        localStorage.setItem('hasSeenOnboarding', 'true')
        gsap.to(containerRef.current, {
          opacity: 0,
          duration: 0.3, // Faster fade out
          ease: 'power3.inOut',
          onComplete: () => setShow(false)
        })
      }
    })

    const slides = [
      { ref: slide1Ref, id: 1 },
      { ref: slide2Ref, id: 2 },
      { ref: slide3Ref, id: 3 },
    ]

    gsap.set([slide2Ref.current, slide3Ref.current], { yPercent: 100 })
    gsap.set(['.ob-text-1', '.ob-text-2', '.ob-text-3'], { y: 80, opacity: 0 })
    gsap.set(['.ob-shape-1', '.ob-shape-2', '.ob-shape-3'], { scale: 0.8, opacity: 0 })

    slides.forEach((slide, index) => {
      tl.to(`.ob-text-${slide.id}`, {
        y: 0,
        opacity: 1,
        duration: 0.45,
        ease: 'power3.out'
      }, index === 0 ? "+=0.1" : "-=0.25")

      tl.to(`.ob-shape-${slide.id}`, {
        scale: 1.2,
        opacity: 1,
        duration: 0.25,
        ease: 'power2.out'
      }, "-=0.25")
        .to(`.ob-shape-${slide.id}`, {
          scale: 1,
          duration: 0.35,
          ease: 'back.out(1.5)'
        })

      if (index < slides.length - 1) {
        tl.to(slide.ref.current, {
          yPercent: -100,
          duration: 0.45,
          ease: 'power3.inOut'
        }, "+=0.45")

        tl.to(slides[index + 1].ref.current, {
          yPercent: 0,
          duration: 0.45,
          ease: 'power3.inOut'
        }, "<")
      } else {
        tl.to({}, { duration: 0.45 })
      }
    })

    return () => {
      tl.kill()
    }
  }, [show])

  if (!show) return null

  const floatingAnim = {
    y: [0, -15, 0],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: 'easeInOut' as any
    }
  }

  return (
    <div ref={containerRef} className="fixed inset-0 z-[9999] overflow-hidden bg-[#fff0f3] touch-none">

      {/* SLIDE 1: Disciplined */}
      <div ref={slide1Ref} className="absolute inset-0 flex flex-col items-center justify-center bg-[#fdeef1]">
        <motion.div
          animate={floatingAnim}
          className="ob-shape-1 absolute w-72 h-72 bg-white/80 rounded-full blur-2xl z-0"
        />
        <h1 className="ob-text-1 z-10 text-4xl sm:text-5xl font-extrabold tracking-tight text-center px-8 text-black">
          More <span className="text-[#ff4b6e]">Disciplined</span>
        </h1>
      </div>

      {/* SLIDE 2: Healthy */}
      <div ref={slide2Ref} className="absolute inset-0 flex flex-col items-center justify-center bg-[#e8f7ec]">
        <motion.div animate={floatingAnim} className="absolute z-0 flex items-center justify-center">
          {/* Heart SVG */}
          <svg viewBox="0 0 24 24" className="ob-shape-2 w-[80vw] max-w-[320px] text-white/90 fill-white/90 blur-xl drop-shadow-lg" strokeWidth={0}>
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </motion.div>
        <h1 className="ob-text-2 z-10 text-4xl sm:text-5xl font-extrabold tracking-tight text-center px-8 text-black">
          More <span className="text-[#10b981]">Healthy</span>
        </h1>
      </div>

      {/* SLIDE 3: Happier */}
      <div ref={slide3Ref} className="absolute inset-0 flex flex-col items-center justify-center bg-[#fdf5e6]">
        <motion.div animate={floatingAnim} className="absolute z-0 flex items-center justify-center">
          {/* Flower Cloud shape base */}
          <svg viewBox="0 0 100 100" className="ob-shape-3 absolute w-[85vw] max-w-[340px] text-white/90 fill-white/90 blur-[28px]" strokeWidth={0}>
            <path d="M50 10C60 10 65 18 70 20C78 20 85 25 88 33C92 40 90 48 90 50C90 52 92 60 88 67C85 75 78 80 70 80C65 82 60 90 50 90C40 90 35 82 30 80C22 80 15 75 12 67C8 60 10 52 10 50C10 48 8 40 12 33C15 25 22 20 30 20C35 18 40 10 50 10Z" />
          </svg>
        </motion.div>
        <h1 className="ob-text-3 z-10 text-4xl sm:text-5xl font-extrabold tracking-tight text-center px-8 text-black">
          More <span className="text-[#f59e0b]">Happier</span>
        </h1>
      </div>

    </div>
  )
}

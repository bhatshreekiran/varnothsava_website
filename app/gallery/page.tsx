'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

export default function GalleryPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return

    // 1. Scene setup
    const scene = new THREE.Scene()
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    )
    camera.position.z = 4.5
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setClearColor(0x000000, 1)
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // 2. Interaction
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.autoRotate = true
    controls.autoRotateSpeed = 0.6
    controlsRef.current = controls

    // 3. Bright Lights (Added just in case, though BasicMaterial ignores them)
    const ambientLight = new THREE.AmbientLight(0xffffff, 2)
    scene.add(ambientLight)

    // 4. Create globe with high-visibility material
    const geometry = new THREE.IcosahedronGeometry(2, 32)
    // MeshBasicMaterial ensures the images stay bright and are not affected by shadows
    const globe = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    )
    scene.add(globe)

    // --- YOUR PICTURE DATA ---
    const eventsData = [
      { name: 'EVENT 01', x: 400, y: 300, color: '#D4A574', size: 160, img: '/events/1.webp' },
      { name: 'EVENT 02', x: 1200, y: 350, color: '#E97132', size: 160, img: '/events/2.webp' },
      { name: 'EVENT 03', x: 600, y: 750, color: '#D4A574', size: 160, img: '/events/3.webp' },
      { name: 'EVENT 04', x: 1600, y: 700, color: '#D97706', size: 160, img: '/events/4.webp' }
    ]

    const loadImagesAndDraw = async () => {
      const canvas = document.createElement('canvas')
      canvas.width = 2048
      canvas.height = 1024
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Background - Deep charcoal instead of pure black for better contrast
      ctx.fillStyle = '#0a0a0a'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Cyber Grid
      ctx.strokeStyle = '#D4A574'
      ctx.lineWidth = 2
      ctx.globalAlpha = 0.15
      for (let i = 0; i < canvas.width; i += 128) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
      }
      for (let i = 0; i < canvas.height; i += 128) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
      }
      ctx.globalAlpha = 1

      // Draw your images
      for (const event of eventsData) {
        const img = new Image()
        img.src = event.img
        
        await new Promise((resolve) => {
          img.onload = () => {
            ctx.save()
            
            // Add slight brightness boost to the image pixels
            ctx.filter = 'brightness(1.1) contrast(1.1)'

            // Draw Glow behind image
            ctx.shadowBlur = 50
            ctx.shadowColor = event.color
            ctx.fillStyle = event.color
            ctx.beginPath()
            ctx.arc(event.x, event.y, event.size + 5, 0, Math.PI * 2)
            ctx.fill()
            
            // Circle Crop
            ctx.beginPath()
            ctx.arc(event.x, event.y, event.size, 0, Math.PI * 2)
            ctx.clip()
            ctx.drawImage(img, event.x - event.size, event.y - event.size, event.size * 2, event.size * 2)
            ctx.restore()

            // Thick neon border
            ctx.strokeStyle = event.color
            ctx.lineWidth = 10
            ctx.beginPath()
            ctx.arc(event.x, event.y, event.size, 0, Math.PI * 2)
            ctx.stroke()
            
            // Bold Text
            ctx.fillStyle = 'white'
            ctx.font = 'bold 50px Arial'
            ctx.textAlign = 'center'
            ctx.fillText(event.name, event.x, event.y + event.size + 80)
            
            resolve(true)
          }
          img.onerror = resolve 
        })
      }

      const texture = new THREE.CanvasTexture(canvas)
      texture.colorSpace = THREE.SRGBColorSpace // Ensures colors look correct in modern Three.js
      globe.material.map = texture
      globe.material.needsUpdate = true
      setMounted(true)
    }

    loadImagesAndDraw()

    let animationId: number
    const animate = () => {
      animationId = requestAnimationFrame(animate)
      if (controlsRef.current) controlsRef.current.update()
      renderer.render(scene, camera)
    }
    animate()

    const handleResize = () => {
      if (!containerRef.current) return
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationId)
      renderer.dispose()
      if (containerRef.current) containerRef.current.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <main className="min-h-screen bg-black overflow-hidden relative text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-[100] border-b border-amber-700/20 backdrop-blur-xl bg-black/80">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-amber-600 animate-pulse rounded-full" />
            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500 tracking-tighter uppercase">
              VARNOTHSAVA
            </h1>
          </Link>
          <div className="flex items-center gap-10">
            <Link href="/events" className="text-xs font-mono text-gray-400 hover:text-amber-500 uppercase tracking-widest">[ Events ]</Link>
            <Link href="/gallery" className="text-xs font-mono text-amber-500 border-b border-amber-500/50 pb-1 uppercase tracking-widest">[ Gallery ]</Link>
          </div>
        </div>
      </nav>

      {/* 3D Viewport */}
      <div className="relative w-full h-screen z-10 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing">
        <div ref={containerRef} className="w-full h-full absolute inset-0" />
        
        {!mounted && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black text-amber-500 font-mono">
             <div className="w-12 h-12 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
             <p className="animate-pulse tracking-[0.3em]">ILLUMINATING GALLERY...</p>
          </div>
        )}

        {/* Text Overlay */}
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 text-center pointer-events-none z-30">
          <h2 className="text-5xl font-black tracking-tighter uppercase italic text-white drop-shadow-2xl">
            Event Showcase
          </h2>
          <p className="text-amber-500 font-mono text-[10px] mt-4 uppercase tracking-[0.6em] bg-black/40 py-1 px-4 inline-block">
            Interact to Explore
          </p>
        </div>
      </div>
    </main>
  )
}
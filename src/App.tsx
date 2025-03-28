
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (!mountRef.current) return

    // Scene setup
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x87CEEB) // Sky blue
    
    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.set(0, 5, 10)
    
    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    mountRef.current.appendChild(renderer.domElement)
    
    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(10, 20, 10)
    scene.add(directionalLight)

    // Airplane creation
    const airplane = createAirplane()
    scene.add(airplane)

    // Ground
    const groundGeometry = new THREE.PlaneGeometry(1000, 1000)
    const groundMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x91C788,
      side: THREE.DoubleSide 
    })
    const ground = new THREE.Mesh(groundGeometry, groundMaterial)
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -50
    scene.add(ground)

    // Game state
    let score = 0
    const rings: THREE.Group[] = []
    const ringCount = 10
    const gameState = {
      speed: 0.5,
      rotationSpeed: 0.03,
      velocity: new THREE.Vector3(),
      isGameOver: false
    }

    // Create initial rings
    for (let i = 0; i < ringCount; i++) {
      const ring = createRing()
      ring.position.set(
        (Math.random() - 0.5) * 100,
        Math.random() * 50 + 10,
        (Math.random() - 0.5) * 100
      )
      rings.push(ring)
      scene.add(ring)
    }

    // Controls
    const keys: { [key: string]: boolean } = {}
    window.addEventListener('keydown', (e) => keys[e.key] = true)
    window.addEventListener('keyup', (e) => keys[e.key] = false)

    // Animation loop
    function animate() {
      if (gameState.isGameOver) return
      
      // Airplane controls
      if (keys['ArrowUp'] || keys['w']) {
        airplane.rotation.x -= gameState.rotationSpeed
      }
      if (keys['ArrowDown'] || keys['s']) {
        airplane.rotation.x += gameState.rotationSpeed
      }
      if (keys['ArrowLeft'] || keys['a']) {
        airplane.rotation.z += gameState.rotationSpeed
      }
      if (keys['ArrowRight'] || keys['d']) {
        airplane.rotation.z -= gameState.rotationSpeed
      }

      // Update airplane position
      const direction = new THREE.Vector3(0, 0, -1)
      direction.applyQuaternion(airplane.quaternion)
      airplane.position.add(direction.multiplyScalar(gameState.speed))

      // Camera follow
      const idealOffset = new THREE.Vector3(0, 3, 10)
      idealOffset.applyQuaternion(airplane.quaternion)
      idealOffset.add(airplane.position)
      camera.position.lerp(idealOffset, 0.1)
      camera.lookAt(airplane.position)

      // Check ring collisions
      rings.forEach((ring, index) => {
        ring.rotation.y += 0.02
        const distance = airplane.position.distanceTo(ring.position)
        
        if (distance < 5) {
          // Collect ring
          scene.remove(ring)
          rings[index].position.set(
            (Math.random() - 0.5) * 100,
            Math.random() * 50 + 10,
            airplane.position.z - 100 - Math.random() * 50
          )
          scene.add(rings[index])
          score += 10
          console.log('Score:', score)
        }
      })

      // Check boundaries
      if (Math.abs(airplane.position.y) > 100 || 
          Math.abs(airplane.position.x) > 100 ||
          Math.abs(airplane.position.z) > 100) {
        gameState.isGameOver = true
        console.log('Game Over! Final Score:', score)
      }

      renderer.render(scene, camera)
      requestAnimationFrame(animate)
    }

    // Start animation
    animate()

    // Handle window resize
    function handleResize() {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('keydown', (e) => keys[e.key] = true)
      window.removeEventListener('keyup', (e) => keys[e.key] = false)
      mountRef.current?.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div ref={mountRef} style={{ width: '100vw', height: '100vh' }}>
      <div style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        color: 'white',
        fontSize: '24px',
        fontFamily: 'Arial',
        textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
      }}>
        Use WASD or Arrow keys to control the plane
      </div>
    </div>
  )
}

function createAirplane() {
  const airplane = new THREE.Group()

  // Fuselage
  const fuselageGeometry = new THREE.ConeGeometry(0.5, 4, 8)
  const fuselajeMaterial = new THREE.MeshPhongMaterial({ color: 0x3498db })
  const fuselage = new THREE.Mesh(fuselageGeometry, fuselajeMaterial)
  fuselage.rotation.x = Math.PI / 2
  airplane.add(fuselage)

  // Wings
  const wingGeometry = new THREE.BoxGeometry(6, 0.2, 1)
  const wingMaterial = new THREE.MeshPhongMaterial({ color: 0x2980b9 })
  const wings = new THREE.Mesh(wingGeometry, wingMaterial)
  wings.position.y = 0.3
  airplane.add(wings)

  // Tail
  const tailGeometry = new THREE.BoxGeometry(1, 1, 0.2)
  const tailMaterial = new THREE.MeshPhongMaterial({ color: 0x2980b9 })
  const tail = new THREE.Mesh(tailGeometry, tailMaterial)
  tail.position.z = 1.5
  tail.position.y = 0.5
  airplane.add(tail)

  return airplane
}

function createRing() {
  const ring = new THREE.Group()
  
  const torusGeometry = new THREE.TorusGeometry(3, 0.2, 16, 32)
  const torusMaterial = new THREE.MeshPhongMaterial({ 
    color: 0xf1c40f,
    emissive: 0xf39c12,
    emissiveIntensity: 0.5
  })
  const torus = new THREE.Mesh(torusGeometry, torusMaterial)
  ring.add(torus)

  return ring
}
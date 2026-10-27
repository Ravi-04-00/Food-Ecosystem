import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { RotateCw, ZoomIn, ZoomOut, Sparkles, Layers, Eye } from 'lucide-react';

export const Interactive3DFoodViewer = ({ 
  dishType = 'burger', 
  hasCheese = true, 
  hasSauce = true, 
  hasFries = false,
  spiceLevel = 'Medium'
}) => {
  const containerRef = useRef(null);
  const [isRotating, setIsRotating] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const sceneRef = useRef(null);
  const foodGroupRef = useRef(null);
  const cheeseMeshRef = useRef(null);
  const friesMeshRef = useRef(null);
  const cameraRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth || 360;
    const height = containerRef.current.clientHeight || 280;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 1.8, 4.5);
    camera.lookAt(0, 0.2, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);

    // 2. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xfff8e8, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight.position.set(4, 8, 4);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const rimLight = new THREE.PointLight(0xff6438, 1.5, 10);
    rimLight.position.set(-3, 2, -2);
    scene.add(rimLight);

    // 3. 3D Food Assembly (Gourmet Hand-crafted Geometry)
    const foodGroup = new THREE.Group();
    foodGroupRef.current = foodGroup;
    scene.add(foodGroup);

    // Bottom Bun
    const bottomBunGeo = new THREE.CylinderGeometry(1.2, 1.1, 0.35, 32);
    const bunMat = new THREE.MeshStandardMaterial({ 
      color: 0xd98236, 
      roughness: 0.6, 
      metalness: 0.1 
    });
    const bottomBun = new THREE.Mesh(bottomBunGeo, bunMat);
    bottomBun.position.y = -0.3;
    bottomBun.castShadow = true;
    bottomBun.receiveShadow = true;
    foodGroup.add(bottomBun);

    // Grilled Patty
    const pattyGeo = new THREE.CylinderGeometry(1.25, 1.25, 0.4, 32);
    const pattyMat = new THREE.MeshStandardMaterial({ 
      color: 0x4a2411, 
      roughness: 0.85, 
      metalness: 0.05 
    });
    const patty = new THREE.Mesh(pattyGeo, pattyMat);
    patty.position.y = 0.05;
    patty.castShadow = true;
    patty.receiveShadow = true;
    foodGroup.add(patty);

    // Melted Cheddar Cheese Layer (Square with drooping corners)
    const cheeseGeo = new THREE.BoxGeometry(1.6, 0.08, 1.6);
    const cheeseMat = new THREE.MeshStandardMaterial({ 
      color: 0xffc83d, 
      roughness: 0.3, 
      metalness: 0.2 
    });
    const cheese = new THREE.Mesh(cheeseGeo, cheeseMat);
    cheese.position.y = 0.28;
    cheese.rotation.y = Math.PI / 4;
    cheese.castShadow = true;
    cheeseMeshRef.current = cheese;
    foodGroup.add(cheese);

    // Fresh Crisp Lettuce
    const lettuceGeo = new THREE.TorusGeometry(1.15, 0.15, 16, 32);
    const lettuceMat = new THREE.MeshStandardMaterial({ 
      color: 0x61b15a, 
      roughness: 0.5 
    });
    const lettuce = new THREE.Mesh(lettuceGeo, lettuceMat);
    lettuce.rotation.x = Math.PI / 2;
    lettuce.position.y = 0.38;
    foodGroup.add(lettuce);

    // Tomato Slice
    const tomatoGeo = new THREE.CylinderGeometry(1.1, 1.1, 0.14, 32);
    const tomatoMat = new THREE.MeshStandardMaterial({ 
      color: 0xff4136, 
      roughness: 0.25 
    });
    const tomato = new THREE.Mesh(tomatoGeo, tomatoMat);
    tomato.position.y = 0.52;
    tomato.castShadow = true;
    foodGroup.add(tomato);

    // Top Brioche Bun Dome
    const topBunGeo = new THREE.SphereGeometry(1.22, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const topBun = new THREE.Mesh(topBunGeo, bunMat);
    topBun.position.y = 0.6;
    topBun.castShadow = true;
    foodGroup.add(topBun);

    // Sesame Seeds on Top Bun
    const seedGeo = new THREE.ConeGeometry(0.03, 0.08, 6);
    const seedMat = new THREE.MeshStandardMaterial({ color: 0xfff4db });
    for (let i = 0; i < 28; i++) {
      const seed = new THREE.Mesh(seedGeo, seedMat);
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 0.9;
      seed.position.set(
        Math.cos(angle) * radius,
        0.6 + Math.sqrt(Math.max(0, 1.22 * 1.22 - radius * radius)) * 0.75,
        Math.sin(angle) * radius
      );
      seed.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.4;
      foodGroup.add(seed);
    }

    // Floating 3D Ingredients / Spices Particles
    const floatingGroup = new THREE.Group();
    const particleGeo = new THREE.DodecahedronGeometry(0.06);
    const particleMat = new THREE.MeshStandardMaterial({ 
      color: spiceLevel === 'Hot' ? 0xff3b30 : 0xffc83d,
      roughness: 0.4 
    });
    for (let i = 0; i < 14; i++) {
      const p = new THREE.Mesh(particleGeo, particleMat);
      p.position.set(
        (Math.random() - 0.5) * 3.4,
        (Math.random() - 0.5) * 2.2 + 0.4,
        (Math.random() - 0.5) * 3.4
      );
      floatingGroup.add(p);
    }
    foodGroup.add(floatingGroup);

    // Shadow Catcher Plate
    const shadowGeo = new THREE.CircleGeometry(1.8, 32);
    const shadowMat = new THREE.MeshBasicMaterial({ 
      color: 0x211a17, 
      transparent: true, 
      opacity: 0.15 
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -0.52;
    foodGroup.add(shadowMesh);

    // Interaction Controls (Drag Rotation)
    let isDragging = false;
    let prevMouseX = 0;

    const handlePointerDown = (e) => {
      isDragging = true;
      prevMouseX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    };

    const handlePointerMove = (e) => {
      if (!isDragging) return;
      const currentX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      const deltaX = currentX - prevMouseX;
      foodGroup.rotation.y += deltaX * 0.015;
      prevMouseX = currentX;
    };

    const handlePointerUp = () => {
      isDragging = false;
    };

    const domElem = renderer.domElement;
    domElem.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    domElem.addEventListener('touchstart', handlePointerDown, { passive: true });
    window.addEventListener('touchmove', handlePointerMove, { passive: true });
    window.addEventListener('touchend', handlePointerUp);

    // Animation Loop
    let reqId;
    const animate = () => {
      reqId = requestAnimationFrame(animate);

      if (isRotating && !isDragging) {
        foodGroup.rotation.y += 0.008;
      }

      // Gentle floating breathing animation
      foodGroup.position.y = Math.sin(Date.now() * 0.002) * 0.06;
      floatingGroup.rotation.y -= 0.004;

      renderer.render(scene, camera);
    };
    animate();

    // Handle Resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(reqId);
      domElem.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      domElem.removeEventListener('touchstart', handlePointerDown);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [dishType]);

  // React to add-ons dynamically
  useEffect(() => {
    if (cheeseMeshRef.current) {
      cheeseMeshRef.current.visible = hasCheese;
      cheeseMeshRef.current.scale.set(hasCheese ? 1.1 : 0.8, 1, hasCheese ? 1.1 : 0.8);
    }
  }, [hasCheese]);

  const handleZoom = (delta) => {
    if (!cameraRef.current) return;
    const newPos = Math.max(3.2, Math.min(6.5, cameraRef.current.position.z + delta));
    cameraRef.current.position.z = newPos;
    setZoomLevel(Math.round((6.5 - newPos) / 3.3 * 100) + 50);
  };

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '300px',
      background: 'radial-gradient(circle, #FFFDF7 0%, #FFF8E8 85%)',
      borderRadius: '20px',
      border: '2px solid #211A17',
      overflow: 'hidden',
      boxShadow: '0 4px 14px rgba(33, 26, 23, 0.08)'
    }}>
      {/* 3D Canvas Container */}
      <div 
        ref={containerRef} 
        style={{ 
          width: '100%', 
          height: '100%', 
          cursor: 'grab', 
          touchAction: 'none' 
        }} 
      />

      {/* Floating 3D Controls Strip */}
      <div style={{
        position: 'absolute',
        top: '12px',
        right: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        zIndex: 10
      }}>
        {/* Toggle Auto Rotation */}
        <button
          onClick={() => setIsRotating(!isRotating)}
          style={{
            background: isRotating ? '#FF6438' : '#FFFFFF',
            color: isRotating ? '#FFFFFF' : '#211A17',
            border: '2px solid #211A17',
            borderRadius: '10px',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 0 #211A17'
          }}
          title={isRotating ? 'Pause rotation' : 'Start 360 rotation'}
        >
          <RotateCw size={16} />
        </button>

        {/* Zoom In */}
        <button
          onClick={() => handleZoom(-0.6)}
          style={{
            background: '#FFFFFF',
            color: '#211A17',
            border: '2px solid #211A17',
            borderRadius: '10px',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 0 #211A17'
          }}
          title="Zoom in 3D view"
        >
          <ZoomIn size={16} />
        </button>

        {/* Zoom Out */}
        <button
          onClick={() => handleZoom(0.6)}
          style={{
            background: '#FFFFFF',
            color: '#211A17',
            border: '2px solid #211A17',
            borderRadius: '10px',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 0 #211A17'
          }}
          title="Zoom out 3D view"
        >
          <ZoomOut size={16} />
        </button>
      </div>

      {/* Floating 3D Badge & Drag Hint */}
      <div style={{
        position: 'absolute',
        bottom: '12px',
        left: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <div style={{
          background: '#FFFFFF',
          border: '1.5px solid #211A17',
          borderRadius: '8px',
          padding: '3px 8px',
          fontSize: '0.72rem',
          fontWeight: 900,
          color: '#FF6438',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          boxShadow: '0 2px 0 #211A17'
        }}>
          <Sparkles size={12} />
          <span>3D PRODUCT VIEW</span>
        </div>

        <span style={{ fontSize: '0.72rem', color: '#6E6259', fontWeight: 700 }}>
          Drag / swipe to rotate 360°
        </span>
      </div>
    </div>
  );
};

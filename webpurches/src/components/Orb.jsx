import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const Orb = ({ className = '' }) => {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 550;
    const height = container.clientHeight || 550;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.5);

    // High precision renderer
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // Master Group for Mouse Parallax
    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    // Studio Ambient Light
    const ambientLight = new THREE.AmbientLight(0xf5f5f7, 0.9);
    scene.add(ambientLight);

    // Studio Key Soft Directional Light
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.9);
    keyLight.position.set(4, 5, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    // Rim Reflector
    const rimLight = new THREE.DirectionalLight(0xe4e4eb, 1.2);
    rimLight.position.set(-4, -2, -4);
    scene.add(rimLight);

    // Internal Amber/Gold Light inside the WS monogram
    const amberCoreLight = new THREE.PointLight(0xD6A85F, 2.5, 6, 1.6);
    amberCoreLight.position.set(0, 0, 0);
    masterGroup.add(amberCoreLight);

    // Shadow Floor Catcher
    const shadowGeo = new THREE.PlaneGeometry(10, 10);
    const shadowMat = new THREE.ShadowMaterial({ opacity: 0.18 });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -2.5;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    // 1. Transparent Glass Sphere (WS ORBIT)
    const sphereGeo = new THREE.SphereGeometry(1.5, 64, 64);
    const sphereMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.94,
      opacity: 1,
      transparent: true,
      roughness: 0.03,
      metalness: 0.05,
      ior: 1.52, // Crown glass
      thickness: 1.8,
      specularIntensity: 1.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      attenuationColor: new THREE.Color(0x151519),
      attenuationDistance: 3.5,
    });
    const glassSphere = new THREE.Mesh(sphereGeo, sphereMat);
    glassSphere.castShadow = true;
    glassSphere.receiveShadow = true;
    masterGroup.add(glassSphere);

    // 2. Floating 3D WS Monogram Object Inside
    const wpGroup = new THREE.Group();
    masterGroup.add(wpGroup);

    // Procedural 3D WS Monogram geometry:
    // Polished faceted central gemstone + sculpted titanium anchors
    const gemGeo = new THREE.OctahedronGeometry(0.68, 0);
    const gemMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0xD6A85F),
      emissive: new THREE.Color(0xB2853E),
      emissiveIntensity: 0.4,
      roughness: 0.08,
      metalness: 0.35,
      transmission: 0.55,
      ior: 2.417, // Diamond
      flatShading: true,
    });
    const gemMesh = new THREE.Mesh(gemGeo, gemMat);
    wpGroup.add(gemMesh);

    // Inner chrome/titanium WS monogram architectural bracket rings
    const innerBracketGeo = new THREE.TorusGeometry(0.85, 0.035, 16, 64);
    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xE0E0E6,
      metalness: 0.95,
      roughness: 0.12,
    });
    const innerBracket = new THREE.Mesh(innerBracketGeo, chromeMat);
    innerBracket.rotation.y = Math.PI / 2;
    wpGroup.add(innerBracket);

    // Light accent pip at crest
    const crestGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const crestMat = new THREE.MeshStandardMaterial({
      color: 0xF0C982,
      emissive: 0xD6A85F,
      emissiveIntensity: 0.9,
      metalness: 0.8,
    });
    const crestPip = new THREE.Mesh(crestGeo, crestMat);
    crestPip.position.set(0, 0.72, 0);
    wpGroup.add(crestPip);

    // 3. Two Thin Chrome Orbital Rings Around Sphere
    // Ring 1
    const ring1Geo = new THREE.TorusGeometry(2.35, 0.024, 32, 128);
    const ring1Mat = new THREE.MeshPhysicalMaterial({
      color: 0xe6e6ea,
      metalness: 0.98,
      roughness: 0.12,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
    });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.rotation.x = Math.PI / 3.2;
    ring1.rotation.y = Math.PI / 5.5;
    ring1.castShadow = true;
    masterGroup.add(ring1);

    // Ring 2
    const ring2Geo = new THREE.TorusGeometry(2.65, 0.02, 32, 128);
    const ring2Mat = new THREE.MeshPhysicalMaterial({
      color: 0xd8d8de,
      metalness: 0.98,
      roughness: 0.14,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.x = -Math.PI / 3.8;
    ring2.rotation.z = Math.PI / 4.2;
    ring2.castShadow = true;
    masterGroup.add(ring2);

    // Mouse Tracking for Parallax
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (event) => {
      const rect = container.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      targetX = x * 0.45;
      targetY = -y * 0.45;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Animation Loop
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Smooth mouse parallax lerp
      mouseX += (targetX - mouseX) * 0.04;
      mouseY += (targetY - mouseY) * 0.04;
      masterGroup.rotation.y = mouseX;
      masterGroup.rotation.x = mouseY;

      // 1. Sphere: Slow floating (↕)
      const floatY = Math.sin(t * 0.75) * 0.09;
      glassSphere.position.y = floatY;
      wpGroup.position.y = floatY;
      amberCoreLight.position.y = floatY;

      // 2. WP Logo inside: Slow rotation (↻)
      wpGroup.rotation.y = t * 0.4;
      wpGroup.rotation.x = Math.sin(t * 0.3) * 0.18;
      wpGroup.rotation.z = Math.cos(t * 0.25) * 0.12;

      // 3. Chrome Rings: Slow orbital rotation (↻)
      ring1.rotation.z = t * 0.12;
      ring1.rotation.y = Math.PI / 5.5 + Math.sin(t * 0.15) * 0.1;

      ring2.rotation.z = -t * 0.09;
      ring2.rotation.x = -Math.PI / 3.8 + Math.cos(t * 0.12) * 0.08;

      // 4. Subtle Lighting Pulse
      amberCoreLight.intensity = 2.0 + Math.sin(t * 1.4) * 0.5;
      gemMat.emissiveIntensity = 0.25 + Math.sin(t * 1.4) * 0.15;

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);

      sphereGeo.dispose();
      sphereMat.dispose();
      gemGeo.dispose();
      gemMat.dispose();
      innerBracketGeo.dispose();
      chromeMat.dispose();
      crestGeo.dispose();
      crestMat.dispose();
      ring1Geo.dispose();
      ring1Mat.dispose();
      ring2Geo.dispose();
      ring2Mat.dispose();
      shadowGeo.dispose();
      shadowMat.dispose();
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div 
      ref={mountRef} 
      className={`relative w-full h-full select-none cursor-grab active:cursor-grabbing ${className}`}
      title="WP ORBIT — Three.js Glass Sphere, Chrome Rings & 3D Monogram"
    >
      {/* Studio lighting atmospheric glows */}
      <div className="absolute top-1/4 left-1/4 w-44 h-44 bg-gradient-to-br from-white/40 to-transparent rounded-full filter blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-36 h-36 bg-[#C8A05F]/15 rounded-full filter blur-2xl pointer-events-none animate-pulse-gold" />
    </div>
  );
};

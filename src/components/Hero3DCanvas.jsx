import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const Hero3DCanvas = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // ─── SCENE, CAMERA, RENDERER ───
    const scene = new THREE.Scene();
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 450;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 24;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // ─── 3D CYBER GEOMETRIC OBJECTS ───
    // 1. Core Icosahedron (Glowing wireframe diamond)
    const coreGeometry = new THREE.IcosahedronGeometry(4.5, 1);
    const coreMaterial = new THREE.MeshPhongMaterial({
      color: 0x3b82f6,
      emissive: 0x1d4ed8,
      wireframe: true,
      transparent: true,
      opacity: 0.85,
      wireframeLinewidth: 2,
    });
    const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
    scene.add(coreMesh);

    // 2. Inner Solid Shimmer Core
    const innerGeometry = new THREE.IcosahedronGeometry(2.8, 0);
    const innerMaterial = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.85,
      roughness: 0.2,
      wireframe: false,
      transparent: true,
      opacity: 0.65,
    });
    const innerMesh = new THREE.Mesh(innerGeometry, innerMaterial);
    scene.add(innerMesh);

    // 3. Orbital Torus Ring 1 (Gold)
    const ring1Geo = new THREE.TorusGeometry(6.2, 0.05, 16, 100);
    const ring1Mat = new THREE.MeshBasicMaterial({ color: 0xd4af37, transparent: true, opacity: 0.7 });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.rotation.x = Math.PI / 3;
    scene.add(ring1);

    // 4. Orbital Torus Ring 2 (Cyan/Blue)
    const ring2Geo = new THREE.TorusGeometry(7.2, 0.04, 16, 100);
    const ring2Mat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.5 });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.y = Math.PI / 4;
    scene.add(ring2);

    // ─── FLOATING 3D PARTICLES FIELD ───
    const particleCount = 750;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleScales = new Float32Array(particleCount);

    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 45;
      particlePositions[i + 1] = (Math.random() - 0.5) * 35;
      particlePositions[i + 2] = (Math.random() - 0.5) * 35;
      particleScales[i / 3] = Math.random() * 2 + 0.5;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    const particleMaterial = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.18,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // ─── LIGHTS ───
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x3b82f6, 3, 50);
    pointLight1.position.set(10, 10, 10);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xd4af37, 2.5, 50);
    pointLight2.position.set(-10, -10, 8);
    scene.add(pointLight2);

    // ─── MOUSE INTERACTION ───
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (event) => {
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      targetX = (x / rect.width) * 1.5;
      targetY = (y / rect.height) * 1.5;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // ─── RESIZE ───
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    // ─── ANIMATION LOOP ───
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse follow (lerp)
      mouseX += (targetX - mouseX) * 0.05;
      mouseY += (targetY - mouseY) * 0.05;

      // Rotate 3D meshes
      coreMesh.rotation.x = elapsedTime * 0.25 + mouseY * 0.5;
      coreMesh.rotation.y = elapsedTime * 0.35 + mouseX * 0.5;

      innerMesh.rotation.x = -elapsedTime * 0.3 + mouseY * 0.3;
      innerMesh.rotation.y = -elapsedTime * 0.4 + mouseX * 0.3;

      ring1.rotation.z = elapsedTime * 0.2;
      ring1.rotation.x = Math.PI / 3 + mouseY * 0.3;

      ring2.rotation.z = -elapsedTime * 0.25;
      ring2.rotation.y = Math.PI / 4 + mouseX * 0.4;

      particles.rotation.y = elapsedTime * 0.05 + mouseX * 0.1;
      particles.rotation.x = -elapsedTime * 0.03 + mouseY * 0.1;

      // Subtle camera floating
      camera.position.x = mouseX * 2;
      camera.position.y = -mouseY * 2;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    };

    animate();

    // ─── CLEANUP ───
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      coreGeometry.dispose();
      coreMaterial.dispose();
      innerGeometry.dispose();
      innerMaterial.dispose();
      ring1Geo.dispose();
      ring1Mat.dispose();
      ring2Geo.dispose();
      ring2Mat.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    />
  );
};

export default Hero3DCanvas;

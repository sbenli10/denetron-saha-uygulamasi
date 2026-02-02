"use client";

import { useEffect, useRef } from "react";

export default function ThreeBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let frameId: number | null = null;
    let renderer: any;

    import("three").then((THREE) => {
      const scene = new THREE.Scene();

      const camera = new THREE.PerspectiveCamera(
        70,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      camera.position.z = 6;

      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true
      });

      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);

      /** — GLOW AMBER GEOMETRY — */
      const geo = new THREE.IcosahedronGeometry(2.8, 1);
      const mat = new THREE.MeshBasicMaterial({
        color: 0xf5b342,      // amber
        wireframe: true,
        transparent: true,
        opacity: 0.25,        // login’den daha düşük, panel için ideal
      });

      const mesh = new THREE.Mesh(geo, mat);
      scene.add(mesh);

      /** MOUSE MOTION */
      let mx = 0;
      let my = 0;

      const animate = () => {
        frameId = requestAnimationFrame(animate);

        mesh.rotation.x += 0.003 + my * 0.00004;
        mesh.rotation.y += 0.002 + mx * 0.00004;

        renderer.render(scene, camera);
      };

      animate();

      const onMove = (e: MouseEvent) => {
        mx = e.clientX - window.innerWidth / 2;
        my = e.clientY - window.innerHeight / 2;
      };

      const onResize = () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("resize", onResize);

      return () => {
        if (frameId) cancelAnimationFrame(frameId);
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("resize", onResize);
        renderer?.dispose?.();
      };
    });
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="
        fixed inset-0
        w-full h-full
        z-0 
        opacity-[0.25]
        pointer-events-none
      "
    />
  );
}

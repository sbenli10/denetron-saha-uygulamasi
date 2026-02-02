"use client";

import { useEffect, useRef } from "react";

export default function GPULiquid() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const glRaw = canvas.getContext("webgl2");
    if (!glRaw) return;
    const gl = glRaw as WebGL2RenderingContext;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    /** Vertex Shader */
    const vert = `#version 300 es
    in vec2 pos;
    out vec2 uv;
    void main(){
      uv = pos * 0.5 + 0.5;
      gl_Position = vec4(pos, 0.0, 1.0);
    }`;

    /** Fragment Shader (Amber Mod) */
    const frag = `#version 300 es
    precision highp float;
    out vec4 FragColor;
    in vec2 uv;
    uniform float time;

    void main(){
      float wave = sin(uv.x * 7.5 + time * 0.9) * 0.12
                 + cos(uv.y * 5.0 + time * 1.3) * 0.10;

      vec3 amber = vec3(1.0, 0.78, 0.35);   // #f5b342 amber glow
      float intensity = 0.08 + wave * 0.08;

      FragColor = vec4(amber * intensity, 0.12); 
    }`;

    const program = gl.createProgram();
    if (!program) return;

    /** Shader loader */
    function sh(type: number, source: string) {
      const s = gl.createShader(type);
      if (!s) return;
      gl.shaderSource(s, source);
      gl.compileShader(s);
      gl.attachShader(program, s);
    }

    sh(gl.VERTEX_SHADER, vert);
    sh(gl.FRAGMENT_SHADER, frag);

    gl.linkProgram(program);
    gl.useProgram(program);

    /** Full screen quad */
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );

    const posLoc = gl.getAttribLocation(program, "pos");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const timeLoc = gl.getUniformLocation(program, "time");

    let frameId: number;

    const render = (t: number) => {
      if (timeLoc) gl.uniform1f(timeLoc, t * 0.001);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      frameId = requestAnimationFrame(render);
    };

    frameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frameId);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="
        fixed inset-0 
        w-full h-full
        z-0 
        opacity-[0.22]
        pointer-events-none
      "
    />
  );
}

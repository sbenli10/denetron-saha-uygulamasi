"use client";

import { useEffect, useRef } from "react";

export default function GPULiquid() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // WebGL2'yi zorunlu olarak non-null yapıyoruz
    const gl = canvas.getContext("webgl2") as WebGL2RenderingContext | null;
    if (!gl) return;

    const glCtx = gl as WebGL2RenderingContext;

    // Canvas boyutları
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const vert = `#version 300 es
    in vec2 pos;
    out vec2 uv;
    void main(){ uv = pos*0.5+0.5; gl_Position=vec4(pos,0,1);} `;

    const frag = `#version 300 es
    precision highp float;
    out vec4 FragColor;
    in vec2 uv;
    uniform float time;
    void main(){
      float w = sin(uv.x*8.0 + time*1.2)*0.1 + cos(uv.y*6.0 + time*1.4)*0.1;
      FragColor = vec4(0.05,0.2+w,0.45+w,0.12);
    }`;

    const program = glCtx.createProgram();
    if (!program) return;

    function makeShader(type: number, source: string) {
      const shader = glCtx.createShader(type);
      if (!shader) return null;
      glCtx.shaderSource(shader, source);
      glCtx.compileShader(shader);
      glCtx.attachShader(program, shader);
      return shader;
    }

    const vShader = makeShader(glCtx.VERTEX_SHADER, vert);
    const fShader = makeShader(glCtx.FRAGMENT_SHADER, frag);

    glCtx.linkProgram(program);
    glCtx.useProgram(program);

    const buffer = glCtx.createBuffer();
    glCtx.bindBuffer(glCtx.ARRAY_BUFFER, buffer);
    glCtx.bufferData(
      glCtx.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      glCtx.STATIC_DRAW
    );

    const posLoc = glCtx.getAttribLocation(program, "pos");
    glCtx.enableVertexAttribArray(posLoc);
    glCtx.vertexAttribPointer(posLoc, 2, glCtx.FLOAT, false, 0, 0);

    const timeLoc = glCtx.getUniformLocation(program, "time");

    let frameId = 0;

    const render = (t: number) => {
      if (timeLoc) glCtx.uniform1f(timeLoc, t * 0.001);
      glCtx.drawArrays(glCtx.TRIANGLE_STRIP, 0, 4);
      frameId = requestAnimationFrame(render);
    };

    frameId = requestAnimationFrame(render);

    // Cleanup
    return () => {
      cancelAnimationFrame(frameId);

      if (buffer) glCtx.deleteBuffer(buffer);
      if (vShader) glCtx.deleteShader(vShader);
      if (fShader) glCtx.deleteShader(fShader);
      glCtx.deleteProgram(program);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
    />
  );
}

"use client";

import { useEffect, useRef } from "react";

export default function ShaderBlur() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl2") as WebGL2RenderingContext | null;
    if (!gl) return;
    const glCtx = gl as WebGL2RenderingContext;

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
      float blur = sin(uv.x*10.0 + time*2.0)*0.05;
      FragColor = vec4(0.1,0.2+blur,0.4+blur,0.15);
    }`;

    const program = glCtx.createProgram();
    if (!program) return;

    function makeShader(type: number, src: string) {
      const s = glCtx.createShader(type);
      if (!s) return;
      glCtx.shaderSource(s, src);
      glCtx.compileShader(s);
      glCtx.attachShader(program, s);
      return s;
    }

    const v = makeShader(glCtx.VERTEX_SHADER, vert);
    const f = makeShader(glCtx.FRAGMENT_SHADER, frag);

    glCtx.linkProgram(program);
    glCtx.useProgram(program);

    const buffer = glCtx.createBuffer();
    if (!buffer) return;

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

    return () => {
      cancelAnimationFrame(frameId);
      if (buffer) glCtx.deleteBuffer(buffer);
      if (v) glCtx.deleteShader(v);
      if (f) glCtx.deleteShader(f);
      glCtx.deleteProgram(program);
    };
  }, []);

  return (
    <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
  );
}

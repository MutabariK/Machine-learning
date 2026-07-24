import React, { useEffect, useRef } from 'react';
import { Box } from '@mui/material';

const VERTEX_SRC = `
attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const FRAGMENT_SRC = `
precision highp float;
varying vec2 v_texCoord;
uniform float u_time;

void main() {
    vec2 uv = v_texCoord;

    // Background Gradient: #145A34 to #1D6F42
    vec3 colorA = vec3(0.078, 0.353, 0.204);
    vec3 colorB = vec3(0.114, 0.435, 0.259);
    vec3 finalColor = mix(colorA, colorB, uv.y + uv.x * 0.5);

    // Floating Gold Orbs: #C8A951
    vec3 gold = vec3(0.784, 0.663, 0.318);
    for (float i = 0.0; i < 5.0; i++) {
        vec2 center = vec2(
            0.5 + 0.3 * sin(u_time * 0.5 + i * 1.5),
            0.5 + 0.3 * cos(u_time * 0.4 + i * 2.0)
        );
        float dist = distance(uv, center);
        float mask = smoothstep(0.15, 0.0, dist);
        finalColor = mix(finalColor, gold, mask * 0.15);
    }

    gl_FragColor = vec4(finalColor, 1.0);
}`;

function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
}

/** Animated WebGL gradient background (green-to-gold, floating orbs) — ported from Stitch design. */
const ShaderBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) return;

    let rafId = 0;

    const syncSize = () => {
      const w = canvas.clientWidth || 1280;
      const h = canvas.clientHeight || 720;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    };

    const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(syncSize) : null;
    resizeObserver?.observe(canvas);
    syncSize();

    const program = gl.createProgram()!;
    gl.attachShader(program, compileShader(gl, gl.VERTEX_SHADER, VERTEX_SRC));
    gl.attachShader(program, compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SRC));
    gl.linkProgram(program);
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const positionLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(program, 'u_time');

    const render = (t: number) => {
      if (!resizeObserver) syncSize();
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (uTime) gl.uniform1f(uTime, t * 0.001);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      rafId = requestAnimationFrame(render);
    };
    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver?.disconnect();
    };
  }, []);

  return (
    <Box sx={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </Box>
  );
};

export default ShaderBackground;

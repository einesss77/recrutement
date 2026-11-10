/* B&M / a continuous metallic ribbon, rendered locally without external assets. */
(() => {
  'use strict';
  const desktop = matchMedia('(min-width: 761px)');
  let initialized = false;
  function initialize() {
  if (initialized || !desktop.matches) return;
  initialized = true;
  const canvas = document.querySelector('[data-kinetic-core]');
  if (!canvas) return;
  const hero = canvas.closest('section') || canvas.parentElement;
  const gl = canvas.getContext('webgl', { alpha: true, antialias: true, powerPreference: 'low-power', premultipliedAlpha: false });
  if (!gl) return;

  const vertexSource = `
    precision highp float;
    attribute vec3 aPosition;
    attribute vec3 aNormal;
    uniform vec2 uOffset;
    uniform vec2 uPointer;
    uniform float uAspect;
    uniform float uScale;
    uniform float uTime;
    varying vec3 vNormal;
    varying vec3 vPosition;
    mat3 rx(float a) { float c=cos(a),s=sin(a); return mat3(1.,0.,0.,0.,c,s,0.,-s,c); }
    mat3 ry(float a) { float c=cos(a),s=sin(a); return mat3(c,0.,-s,0.,1.,0.,s,0.,c); }
    mat3 rz(float a) { float c=cos(a),s=sin(a); return mat3(c,s,0.,-s,c,0.,0.,0.,1.); }
    void main() {
      mat3 rotation = rz(-.32 + sin(uTime*.19)*.14) * ry(-.46 + uTime*.22 + uPointer.x*.24) * rx(.48 + sin(uTime*.27)*.16 + uPointer.y*.15);
      vec3 p = rotation * aPosition;
      float breath = 1. + sin(uTime*.6)*.025;
      p *= breath;
      vNormal = rotation*aNormal;
      vPosition = p;
      float perspective = 5.5/(5.5-p.z*.42);
      gl_Position = vec4(vec2(p.x/uAspect,p.y)*uScale*perspective + uOffset, -p.z*.14, 1.);
    }
  `;
  const fragmentSource = `
    precision highp float;
    varying vec3 vNormal;
    varying vec3 vPosition;
    vec3 environment(vec3 r) {
      // An abstract studio: broad white softboxes, a lime reflector, blue edge light.
      float top = smoothstep(-.3,.9,r.y);
      vec3 color = mix(vec3(.008,.012,.018),vec3(.16,.18,.22),top);
      float softbox = pow(max(0.,dot(r,normalize(vec3(-.65,.8,1.)))),14.);
      float strip = pow(max(0.,1.-abs(r.x*.72+r.y*.34-.18)),38.);
      float left = pow(max(0.,dot(r,normalize(vec3(-1.,-.22,.35)))),16.);
      float rim = pow(max(0.,dot(r,normalize(vec3(.9,.25,-.25)))),10.);
      color += vec3(.94,.97,1.)*(softbox*2.5+strip*1.8);
      color += vec3(.70,1.,.015)*left*1.8;
      color += vec3(.08,.22,1.)*rim*1.1;
      float blackFlag = smoothstep(.16,.30,r.y)* (1.-smoothstep(.38,.48,r.y));
      color *= 1.-blackFlag*.70;
      return color;
    }
    void main() {
      vec3 n = normalize(vNormal);
      if (!gl_FrontFacing) n = -n;
      vec3 view = normalize(vec3(0.,0.,6.)-vPosition*.3);
      vec3 reflection = reflect(-view,n);
      float fresnel = pow(1.-max(0.,dot(n,view)),3.);
      vec3 chrome = environment(reflection);
      float key = max(0.,dot(n,normalize(vec3(-.6,.9,1.))));
      vec3 color = chrome*.94 + vec3(.035,.04,.05)*key + vec3(.58,.64,.73)*fresnel*.12;
      // A narrow edge catches the light instead of painting a flat outline.
      color += vec3(.80,1.,.08)*pow(fresnel,4.)*.16;
      color = color/(color+vec3(.72));
      color = pow(color,vec3(.92));
      gl_FragColor = vec4(color,1.);
    }
  `;

  function shader(type, source) {
    const value = gl.createShader(type);
    gl.shaderSource(value, source);
    gl.compileShader(value);
    if (!gl.getShaderParameter(value, gl.COMPILE_STATUS)) {
      gl.deleteShader(value);
      return null;
    }
    return value;
  }
  const vertex = shader(gl.VERTEX_SHADER, vertexSource);
  const fragment = shader(gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertex || !fragment) return;
  const program = gl.createProgram();
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
  gl.useProgram(program);

  const TAU = Math.PI * 2;
  const normalize = p => { const m = Math.hypot(...p) || 1; return p.map(v => v / m); };
  const cross = (a, b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  function center(t) {
    const radius = 1.05 + .38 * Math.cos(3*t);
    return [radius*Math.cos(2*t),radius*Math.sin(2*t),.5*Math.sin(3*t)];
  }
  function surface(t, a) {
    const p = center(t);
    const next = center(t+.001);
    const previous = center(t-.001);
    const tangent = normalize(next.map((v,i)=>v-previous[i]));
    const outward = normalize(cross(tangent,[0,0,1]));
    const binormal = normalize(cross(tangent,outward));
    const twist = t + .36 * Math.sin(t*3);
    const wide = .24 + .035 * Math.cos(t*3);
    const thin = .095;
    const x = Math.cos(a)*wide;
    const y = Math.sin(a)*thin;
    const u = x*Math.cos(twist)-y*Math.sin(twist);
    const v = x*Math.sin(twist)+y*Math.cos(twist);
    return p.map((value,i)=>value+outward[i]*u+binormal[i]*v);
  }

  const rings = 360;
  const sides = 24;
  const positions = [];
  const normals = [];
  const indices = [];
  for (let i=0;i<=rings;i++) {
    const t = i/rings*TAU;
    for (let j=0;j<=sides;j++) {
      const a = j/sides*TAU;
      const p = surface(t,a);
      const pt = surface(t+.0005,a);
      const pa = surface(t,a+.0005);
      const normal = normalize(cross(pa.map((v,k)=>v-p[k]),pt.map((v,k)=>v-p[k])));
      positions.push(...p);
      normals.push(...normal);
      if (i<rings&&j<sides) {
        const start = i*(sides+1)+j;
        indices.push(start,start+1,start+sides+1,start+1,start+sides+2,start+sides+1);
      }
    }
  }
  function attribute(name, values) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(values),gl.STATIC_DRAW);
    const location = gl.getAttribLocation(program,name);
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location,3,gl.FLOAT,false,0,0);
  }
  attribute('aPosition',positions);
  attribute('aNormal',normals);
  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.clearColor(0,0,0,0);
  const uniform = Object.fromEntries(['uOffset','uPointer','uAspect','uScale','uTime'].map(name=>[name,gl.getUniformLocation(program,name)]));

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let visible = true;
  let paused = false;
  let lost = false;
  let frame = 0;
  let lastTime = 0;
  let time = 1.8;
  let width = 0;
  let height = 0;
  const pointer = { x:0,y:0,tx:0,ty:0 };

  function draw() {
    if (!width || !height || lost) return;
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.uniform1f(uniform.uTime,time);
    gl.uniform2f(uniform.uPointer,pointer.x,pointer.y);
    gl.drawElements(gl.TRIANGLES,indices.length,gl.UNSIGNED_SHORT,0);
    canvas.dataset.ready = 'true';
  }
  function resize() {
    const bounds = canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    width = bounds.width;
    height = bounds.height;
    const dpr = Math.min(devicePixelRatio||1,1.5,Math.sqrt(1500000/(width*height)));
    canvas.width = Math.round(width*dpr);
    canvas.height = Math.round(height*dpr);
    gl.viewport(0,0,canvas.width,canvas.height);
    const mobile = innerWidth<=760;
    const diameter = mobile ? width*1.16 : Math.min(width*.66,height*1.1);
    gl.uniform1f(uniform.uAspect,width/height);
    gl.uniform1f(uniform.uScale,diameter/(3.4*height)*2);
    gl.uniform2f(uniform.uOffset,mobile?.22:.54,mobile?-.52:0);
    draw();
  }
  function tick(now) {
    frame = requestAnimationFrame(tick);
    const delta = lastTime ? now-lastTime : 34;
    if (delta<32) return;
    lastTime = now;
    time += Math.min(delta,70)/1000;
    pointer.x += (pointer.tx-pointer.x)*.08;
    pointer.y += (pointer.ty-pointer.y)*.08;
    draw();
  }
  function syncMotion() {
    const running = desktop.matches&&visible&&!document.hidden&&!paused&&!reduced.matches&&!lost;
    if (running&&!frame) frame=requestAnimationFrame(tick);
    if (!running&&frame) { cancelAnimationFrame(frame);frame=0;lastTime=0; }
  }
  window.addEventListener('bm:motion',event=>{paused=event.detail?.paused===true;syncMotion();});
  document.addEventListener('visibilitychange',syncMotion);
  reduced.addEventListener('change',()=>{if(reduced.matches){pointer.x=pointer.y=pointer.tx=pointer.ty=0;draw();}syncMotion();});
  hero.addEventListener('pointermove',event=>{
    if(event.pointerType==='touch'||paused||reduced.matches)return;
    const bounds=hero.getBoundingClientRect();
    pointer.tx=((event.clientX-bounds.left)/bounds.width-.5)*2;
    pointer.ty=((event.clientY-bounds.top)/bounds.height-.5)*2;
  },{passive:true});
  hero.addEventListener('pointerleave',()=>{pointer.tx=pointer.ty=0;},{passive:true});
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();lost=true;delete canvas.dataset.ready;syncMotion();});
  // The static artwork remains available if the browser cannot retain a WebGL context.
  if('IntersectionObserver'in window)new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;syncMotion();},{rootMargin:'80px'}).observe(hero);
  if('ResizeObserver'in window)new ResizeObserver(resize).observe(canvas);
  else window.addEventListener('resize',resize,{passive:true});
  desktop.addEventListener('change',()=>{if(desktop.matches)resize();syncMotion();});
  resize();
  syncMotion();
  }
  desktop.addEventListener('change',initialize);
  initialize();
})();

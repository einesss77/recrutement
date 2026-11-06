/* A projected architectural study. Each signal follows a real contour. */
(() => {
  const canvas = document.querySelector('.ph-hero [data-signal-field]');
  if (!canvas || typeof Path2D === 'undefined') return;
  const hero = canvas.closest('.ph-hero');
  const context = canvas.getContext('2d');
  if (!context) return;

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const frameInterval = 1000 / 30;
  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
  let drawing;
  let frame = 0;
  let previousTime = 0;
  let elapsed = 0;
  let visible = true;
  let paused = false;

  function buildDrawing(width, height) {
    const mobile = width <= 760;
    const scale = mobile ? Math.min(width * .77, height * .56) : Math.min(width * .43, height * .80);
    const originX = width * (mobile ? .63 : .735);
    const originY = height * (mobile ? .91 : .87);
    const ratio = Math.min(window.devicePixelRatio || 1, 1.65, Math.sqrt(2200000 / (width * height)));
    const project = (x, y, depth) => [
      originX + scale * (x * .88 + depth * .52),
      originY + scale * (x * .135 - y - depth * .28),
    ];

    function contour(radius, depth) {
      const leg = .39;
      const length = leg * 2 + Math.PI * radius;
      const path = new Path2D();
      const points = [];
      for (let index = 0; index <= 86; index++) {
        const distance = index / 86 * length;
        let x = -radius;
        let y = distance;
        if (distance >= length - leg) {
          x = radius;
          y = length - distance;
        } else if (distance > leg) {
          const angle = Math.PI - (distance - leg) / radius;
          x = radius * Math.cos(angle);
          y = leg + radius * Math.sin(angle);
        }
        // Twist the peak slightly across the depth of the structure.
        x += depth * y * .17;
        const point = project(x, y, depth);
        points.push(point);
        if (index === 0) path.moveTo(...point);
        else path.lineTo(...point);
      }
      return { path, points };
    }

    const ribCount = mobile ? 17 : 24;
    const ribs = Array.from({ length: ribCount }, (_, index) => {
      const progress = index / (ribCount - 1);
      return contour(.49 + .045 * Math.sin(progress * Math.PI), -.18 + progress * .74);
    });
    const front = ribs[0];
    const back = ribs.at(-1);
    const inner = contour(.42, -.18);
    const seams = new Path2D();
    for (let index = 0; index < front.points.length; index += 4) {
      seams.moveTo(...front.points[index]);
      for (const rib of ribs.slice(1)) seams.lineTo(...rib.points[index]);
    }
    const face = new Path2D(front.path);
    for (let index = inner.points.length - 1; index >= 0; index--) face.lineTo(...inner.points[index]);
    face.closePath();

    const floor = new Path2D();
    for (let index = -8; index <= 8; index++) {
      const position = index * .155;
      floor.moveTo(...project(position, 0, -.83));
      floor.lineTo(...project(position, 0, .94));
      if (index > -7 && index < 7) {
        floor.moveTo(...project(-1.3, 0, position));
        floor.lineTo(...project(1.15, 0, position));
      }
    }
    const dimension = new Path2D();
    const marks = [project(-.55, -.09, -.35), project(.55, -.09, -.35)];
    dimension.moveTo(...marks[0]);
    dimension.lineTo(...marks[1]);
    for (const [x, y] of marks) {
      dimension.moveTo(x - 3, y + 4);
      dimension.lineTo(x + 3, y - 4);
    }
    const axisX = originX + scale * .02;
    const axisY = originY - scale * .30;
    dimension.moveTo(axisX - 9, axisY);
    dimension.lineTo(axisX + 9, axisY);
    dimension.moveTo(axisX, axisY - 9);
    dimension.lineTo(axisX, axisY + 9);
    dimension.moveTo(axisX + 4, axisY);
    dimension.arc(axisX, axisY, 4, 0, Math.PI * 2);

    const light = context.createRadialGradient(originX, originY - scale * .5, 0, originX, originY - scale * .5, scale * 1.02);
    light.addColorStop(0, mobile ? 'rgba(56,128,99,.20)' : 'rgba(56,128,99,.28)');
    light.addColorStop(.55, 'rgba(37,102,78,.10)');
    light.addColorStop(1, 'rgba(37,102,78,0)');

    return { width, height, ratio, mobile, ribs, front, back, inner, seams, face, floor, dimension, light };
  }

  function signal(track, progress, color, halo) {
    const end = progress * (track.points.length - 1);
    const index = Math.min(track.points.length - 2, Math.floor(end));
    const [x1, y1] = track.points[index];
    const [x2, y2] = track.points[index + 1];
    const fraction = end - index;
    const x = x1 + (x2 - x1) * fraction;
    const y = y1 + (y2 - y1) * fraction;
    const trailStart = Math.max(0, index - 9);
    const [startX, startY] = track.points[trailStart];
    const gradient = context.createLinearGradient(startX, startY, x, y);
    gradient.addColorStop(0, 'transparent');
    gradient.addColorStop(1, color);
    context.beginPath();
    context.moveTo(startX, startY);
    for (let point = trailStart + 1; point <= index; point++) context.lineTo(...track.points[point]);
    context.lineTo(x, y);
    context.strokeStyle = gradient;
    context.lineWidth = 1.7;
    context.stroke();
    context.beginPath();
    context.fillStyle = halo;
    context.arc(x, y, 6.5, 0, Math.PI * 2);
    context.fill();
    context.beginPath();
    context.fillStyle = color;
    context.arc(x, y, 2.1, 0, Math.PI * 2);
    context.fill();
  }

  function render() {
    if (!drawing) return;
    const { width, height, ratio, mobile, ribs, front, back, inner, seams, face, floor, dimension, light } = drawing;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);
    context.fillStyle = light;
    context.fillRect(0, 0, width, height);
    context.save();
    context.translate(pointer.x + Math.sin(elapsed * .58) * 5, pointer.y + Math.sin(elapsed * .74) * 4);
    context.lineWidth = .75;
    context.strokeStyle = 'rgba(144,196,162,.15)';
    context.stroke(floor);
    context.strokeStyle = 'rgba(154,210,177,.34)';
    context.stroke(dimension);
    for (let index = ribs.length - 1; index >= 0; index--) {
      const pulse = .04 * Math.sin(elapsed * 1.12 - index * .39);
      context.strokeStyle = `rgba(127,204,167,${(mobile ? .24 : .29) + pulse})`;
      context.stroke(ribs[index].path);
    }
    context.strokeStyle = 'rgba(112,196,150,.25)';
    context.stroke(seams);
    context.fillStyle = 'rgba(102,183,141,.08)';
    context.fill(face);
    context.strokeStyle = 'rgba(207,225,187,.50)';
    context.stroke(back.path);
    context.strokeStyle = 'rgba(176,224,195,.70)';
    context.stroke(inner.path);
    context.lineWidth = 1.45;
    context.strokeStyle = 'rgba(187,231,200,.93)';
    context.stroke(front.path);
    signal(front, (elapsed * .118 + .38) % 1, '#d6ffe2', 'rgba(162,246,189,.20)');
    signal(ribs[Math.floor(ribs.length * .63)], (elapsed * .097 + .51) % 1, '#efc193', 'rgba(241,175,125,.21)');
    signal(back, 1 - ((elapsed * .077 + .24) % 1), '#95dbb5', 'rgba(149,219,181,.16)');
    context.restore();
    if (!canvas.dataset.signalReady) canvas.dataset.signalReady = 'true';
  }

  function resize() {
    const { width, height } = canvas.getBoundingClientRect();
    if (!width || !height) return;
    if (drawing?.width === width && drawing.height === height) return;
    drawing = buildDrawing(width, height);
    canvas.width = Math.round(width * drawing.ratio);
    canvas.height = Math.round(height * drawing.ratio);
    render();
  }

  function tick(time) {
    frame = requestAnimationFrame(tick);
    if (!previousTime) previousTime = time - frameInterval;
    const delta = time - previousTime;
    if (delta < frameInterval - 1) return;
    previousTime = time;
    elapsed += Math.min(delta, 65) / 1000;
    pointer.x += (pointer.targetX - pointer.x) * .105;
    pointer.y += (pointer.targetY - pointer.y) * .105;
    render();
  }

  function updateMotion() {
    const running = visible && !document.hidden && !reducedMotion.matches && !paused;
    if (running && !frame) frame = requestAnimationFrame(tick);
    else if (!running && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
      previousTime = 0;
    }
  }

  hero.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch' || reducedMotion.matches || paused) return;
    const bounds = hero.getBoundingClientRect();
    pointer.targetX = ((event.clientX - bounds.left) / bounds.width - .5) * 31;
    pointer.targetY = ((event.clientY - bounds.top) / bounds.height - .5) * 24;
  }, { passive: true });
  hero.addEventListener('pointerleave', () => {
    pointer.targetX = 0;
    pointer.targetY = 0;
  }, { passive: true });
  window.addEventListener('bm:signal-motion', event => {
    paused = event.detail?.paused === true;
    updateMotion();
  });
  document.addEventListener('visibilitychange', updateMotion);
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) {
      pointer.x = pointer.y = pointer.targetX = pointer.targetY = 0;
      render();
    }
    updateMotion();
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      updateMotion();
    }).observe(hero);
  }
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
  else window.addEventListener('resize', resize, { passive: true });
  resize();
  updateMotion();
})();

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { t } from '../i18n.js';
import { currentProject } from '../store.js';
import { partTotals } from '../calc.js';
import { icon } from '../ui/icons.js';
import { pageHeader, toast } from '../ui/ui.js';
import { canvasToImage } from '../utils/export.js';
import { esc, clamp } from '../utils/helpers.js';

export function render(root, { route }) {
  const proj = currentProject();
  if (!proj) { root.innerHTML = `<p class="text-zinc-500">${t('select_project')}</p>`; return; }
  const isExploded = route === 'exploded';

  root.innerHTML = `
    ${pageHeader(isExploded ? t('nav_exploded') : t('nav_design3d'), esc(proj.name),
      `<button class="btn btn-ghost text-xs" id="snap-png">${icon('download', 14)} PNG</button>`)}
    <div class="flex flex-col xl:flex-row gap-4">
      <div class="flex-1 glass neon-border rounded-2xl p-2 relative" style="min-height:64vh">
        <div id="vp" class="w-full h-full rounded-xl overflow-hidden" style="height:64vh;background:radial-gradient(circle at 50% 30%, #1a0000, #000)"></div>
        <!-- view cube -->
        <div class="absolute top-3 left-3 flex gap-1 z-10">
          ${['front','side','top','iso'].map((v)=>`<button class="btn-tool text-[11px] px-2 py-1 rounded-lg" data-view="${v}">${t(v)}</button>`).join('')}
          <button class="btn-tool text-[11px] px-2 py-1 rounded-lg" data-view="reset">${t('reset_view')}</button>
        </div>
        <div class="absolute bottom-3 left-3 text-[10px] text-zinc-500 glass-soft px-2 py-1 rounded" id="vp-hud"></div>
      </div>

      <!-- controls -->
      <div class="glass neon-border rounded-2xl p-4 xl:w-72 space-y-4">
        <div>
          <div class="flex justify-between text-xs mb-1"><span class="text-zinc-300">${t('explode_factor')}</span><span class="text-red-300 font-bold" id="ef-lbl">${isExploded?'60':'0'}%</span></div>
          <input type="range" min="0" max="100" value="${isExploded?60:0}" id="explode" class="w-full accent-red-600"/>
          <div class="flex gap-2 mt-2">
            <button class="btn btn-ghost text-xs flex-1" id="btn-explode">${icon('explode',14)} ${t('explode')}</button>
            <button class="btn btn-ghost text-xs flex-1" id="btn-assemble">${icon('cube',14)} ${t('assemble')}</button>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <button class="btn-tool text-xs py-2 rounded-lg" id="t-rotate">${icon('rotate',14)} ${t('auto_rotate')}</button>
          <button class="btn-tool text-xs py-2 rounded-lg" id="t-wire">${icon('layers',14)} ${t('wireframe')}</button>
          <button class="btn-tool text-xs py-2 rounded-lg" id="t-labels">${icon('list',14)} ${t('dimensions')}</button>
          <button class="btn-tool text-xs py-2 rounded-lg" id="add-box">${icon('plus',14)} ${t('add_box')}</button>
        </div>
        <div>
          <h3 class="font-display font-bold text-sm mb-2">${t('properties')}</h3>
          <div id="sel-props" class="text-xs text-zinc-500">${t('tool_select')}…</div>
        </div>
        <div class="text-[10px] text-zinc-500 border-t border-red-900/30 pt-2">
          ${proj.parts.length} ${t('pieces')} · ${t('iso')} / Orbit
        </div>
      </div>
    </div>`;

  init3D(root, proj, isExploded);
}

function init3D(root, proj, startExploded) {
  const vp = root.querySelector('#vp');
  const hud = root.querySelector('#vp-hud');
  const W = () => vp.clientWidth, H = () => vp.clientHeight;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x100000, 6, 26);
  const camera = new THREE.PerspectiveCamera(45, W() / H(), 0.01, 1000);
  camera.position.set(3.2, 2.6, 4.2);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setSize(W(), H()); renderer.setPixelRatio(Math.min(2, devicePixelRatio));
  vp.appendChild(renderer.domElement);

  const labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(W(), H());
  Object.assign(labelRenderer.domElement.style, { position: 'absolute', top: '0', left: '0', pointerEvents: 'none' });
  vp.appendChild(labelRenderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.08;
  controls.minDistance = 1; controls.maxDistance = 40;

  // lights
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const key = new THREE.DirectionalLight(0xffffff, 1.1); key.position.set(5, 8, 6); scene.add(key);
  const red = new THREE.PointLight(0xff0000, 30, 30); red.position.set(-4, 3, -3); scene.add(red);
  const red2 = new THREE.PointLight(0x8b0000, 20, 30); red2.position.set(4, -1, 4); scene.add(red2);

  // grid floor
  const grid = new THREE.GridHelper(20, 40, 0xff0000, 0x440000);
  grid.material.opacity = 0.25; grid.material.transparent = true; grid.position.y = -0.01; scene.add(grid);

  // ---- build parts ----
  const group = new THREE.Group(); scene.add(group);
  const meshes = [];
  const physicalParts = proj.parts.filter((p) => !['fabric'].includes(p.category) || true); // include all; fabric thin
  // auto-layout grid for parts without pos
  let gi = 0; const cols = Math.ceil(Math.sqrt(physicalParts.length));
  physicalParts.forEach((p, idx) => {
    const L = Math.max(p.length, 4) / 1000, Wd = Math.max(p.width, 4) / 1000, Th = Math.max(p.thickness, 4) / 1000;
    const geo = new THREE.BoxGeometry(L, Th, Wd);
    const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(p.color || '#c98a4b'), roughness: 0.6, metalness: 0.15 });
    const mesh = new THREE.Mesh(geo, mat);
    let base;
    if (p.pos) base = new THREE.Vector3(p.pos.x / 1000, p.pos.y / 1000, p.pos.z / 1000);
    else { const c = gi % cols, r = Math.floor(gi / cols); base = new THREE.Vector3((c - cols / 2) * (L + 0.15), Th / 2 + 0.02, (r - cols / 2) * (Wd + 0.15)); gi++; }
    mesh.position.copy(base);
    mesh.userData = { part: p, idx: idx + 1, base: base.clone(), dims: { L, Wd, Th } };
    // edges
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: 0xff5a5a, transparent: true, opacity: 0.5 }));
    mesh.add(edges);
    group.add(mesh); meshes.push(mesh);

    // label
    const div = document.createElement('div');
    div.className = 'tag3d';
    div.style.cssText = 'background:rgba(0,0,0,0.8);border:1px solid #ff0000;color:#fff;font:11px Inter;padding:2px 6px;border-radius:6px;box-shadow:0 0 8px rgba(255,0,0,0.6);white-space:nowrap';
    div.innerHTML = `<b style="color:#ff5a5a">${idx + 1}</b> ${esc(p.code)} · ${p.length}×${p.width}×${p.thickness}`;
    const label = new CSS2DObject(div);
    label.position.set(0, Th / 2 + 0.05, 0);
    mesh.add(label); mesh.userData.label = label;
    label.visible = startExploded;
  });

  // center group on origin
  const box = new THREE.Box3().setFromObject(group);
  const center = box.getCenter(new THREE.Vector3());
  group.children.forEach((m) => { m.userData.base.sub(center); m.position.sub(center); });
  controls.target.set(0, 0, 0);

  // ---- explode logic ----
  let explodeFactor = startExploded ? 0.6 : 0;
  function applyExplode() {
    meshes.forEach((m) => {
      const dir = m.userData.base.clone(); const len = dir.length() || 0.001;
      const offset = dir.clone().normalize().multiplyScalar(len * explodeFactor * 1.8);
      m.position.copy(m.userData.base.clone().add(offset));
    });
  }
  applyExplode();

  // ---- selection ----
  const raycaster = new THREE.Raycaster(); const mouse = new THREE.Vector2();
  let selected = null;
  renderer.domElement.addEventListener('pointerdown', (e) => {
    const r = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    mouse.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const hit = raycaster.intersectObjects(meshes, false)[0];
    selectMesh(hit ? hit.object : null);
  });
  function selectMesh(m) {
    if (selected) selected.material.emissive?.setHex(0x000000);
    selected = m;
    const el = root.querySelector('#sel-props');
    if (!m) { el.innerHTML = `<p class="text-xs text-zinc-500">${t('tool_select')}…</p>`; return; }
    m.material.emissive = new THREE.Color(0x550000);
    const p = m.userData.part; const tot = partTotals(p);
    el.innerHTML = `
      <div class="text-[10px] uppercase text-red-400">#${m.userData.idx} · ${esc(p.code)}</div>
      <div class="font-semibold text-sm mb-2">${esc(p.name)}</div>
      ${ctrl('rx', t('rotate') + ' X')} ${ctrl('ry', t('rotate') + ' Y')}
      <div class="mt-2"><label class="lbl text-[9px]">${t('explode_factor')} (${t('properties')})</label></div>
      <div class="text-[11px] text-zinc-300 mt-2 space-y-0.5">
        <div>${t('length')}: ${p.length} mm</div><div>${t('width')}: ${p.width} mm</div>
        <div>${t('thickness')}: ${p.thickness} mm</div><div>${t('weight')}: ${tot.weight.toFixed(2)} kg</div>
      </div>`;
    el.querySelectorAll('[data-rot]').forEach((s) => s.addEventListener('input', () => {
      if (s.dataset.rot === 'rx') m.rotation.x = (+s.value) * Math.PI / 180;
      else m.rotation.y = (+s.value) * Math.PI / 180;
    }));
  }
  function ctrl(id, label) {
    return `<div class="mb-1"><label class="lbl text-[9px]">${label}</label><input type="range" min="0" max="360" value="0" data-rot="${id}" class="w-full accent-red-600"/></div>`;
  }

  // ---- UI wiring ----
  const ef = root.querySelector('#explode'); const efl = root.querySelector('#ef-lbl');
  ef.addEventListener('input', () => { explodeFactor = +ef.value / 100; efl.textContent = ef.value + '%'; applyExplode(); });
  root.querySelector('#btn-explode').addEventListener('click', () => { animateExplode(0.7); });
  root.querySelector('#btn-assemble').addEventListener('click', () => { animateExplode(0); });
  function animateExplode(target) {
    const start = explodeFactor, t0 = performance.now(), dur = 600;
    (function step(now) {
      const k = clamp((now - t0) / dur, 0, 1); explodeFactor = start + (target - start) * (k * (2 - k));
      ef.value = Math.round(explodeFactor * 100); efl.textContent = ef.value + '%'; applyExplode();
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }

  let autoRotate = false;
  root.querySelector('#t-rotate').addEventListener('click', (e) => { autoRotate = !autoRotate; controls.autoRotate = autoRotate; controls.autoRotateSpeed = 1.6; e.currentTarget.classList.toggle('active', autoRotate); });
  let wire = false;
  root.querySelector('#t-wire').addEventListener('click', (e) => { wire = !wire; meshes.forEach((m) => (m.material.wireframe = wire)); e.currentTarget.classList.toggle('active', wire); });
  let labelsOn = startExploded;
  const tLabels = root.querySelector('#t-labels');
  if (labelsOn) tLabels.classList.add('active');
  tLabels.addEventListener('click', (e) => { labelsOn = !labelsOn; meshes.forEach((m) => (m.userData.label.visible = labelsOn)); e.currentTarget.classList.toggle('active', labelsOn); });
  root.querySelector('#add-box').addEventListener('click', () => {
    const geo = new THREE.BoxGeometry(0.6, 0.3, 0.4);
    const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0xc98a4b, roughness: 0.6 }));
    mesh.position.set(0, 0.15, 0); mesh.userData = { part: { code: 'NEW', name: t('add_box'), length: 600, width: 400, thickness: 300 }, idx: meshes.length + 1, base: mesh.position.clone(), dims: {} };
    mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: 0xff5a5a })));
    group.add(mesh); meshes.push(mesh); toast(t('created_ok'));
  });

  // views
  const dist = box.getSize(new THREE.Vector3()).length() || 4;
  const views = {
    front: [0, 0, dist], side: [dist, 0, 0], top: [0, dist, 0.01], iso: [dist * 0.7, dist * 0.6, dist * 0.7], reset: [3.2, 2.6, 4.2],
  };
  root.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => {
    const v = views[b.dataset.view]; camera.position.set(v[0], v[1], v[2]); controls.target.set(0, 0, 0); controls.update();
  }));

  root.querySelector('#snap-png').addEventListener('click', () => { renderer.render(scene, camera); canvasToImage(renderer.domElement, `${proj.name}_3D.png`); toast(t('exported_ok')); });

  // resize
  const ro = new ResizeObserver(() => { camera.aspect = W() / H(); camera.updateProjectionMatrix(); renderer.setSize(W(), H()); labelRenderer.setSize(W(), H()); }); ro.observe(vp);

  // loop
  let raf;
  (function loop() {
    raf = requestAnimationFrame(loop);
    controls.update();
    renderer.render(scene, camera); labelRenderer.render(scene, camera);
    hud.textContent = `Orbit · ${meshes.length} ${t('pieces')}`;
  })();

  // cleanup when leaving (best-effort)
  const stop = () => { cancelAnimationFrame(raf); ro.disconnect(); renderer.dispose(); window.removeEventListener('hashchange', stop); };
  window.addEventListener('hashchange', stop, { once: true });
}

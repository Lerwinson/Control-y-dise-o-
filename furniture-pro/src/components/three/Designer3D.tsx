'use client';
import { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Grid, Edges } from '@react-three/drei';
import * as THREE from 'three';
import { useT, useCurrentProject } from '@/lib/store';
import { partTotals } from '@/lib/calc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { Part } from '@/lib/types';

interface PlacedPart { part: Part; idx: number; base: THREE.Vector3; dims: [number, number, number]; }

function usePlacedParts(parts: Part[]): { placed: PlacedPart[]; center: THREE.Vector3 } {
  return useMemo(() => {
    const cols = Math.ceil(Math.sqrt(parts.length || 1));
    let gi = 0;
    const placed: PlacedPart[] = parts.map((p, idx) => {
      const L = Math.max(p.length, 4) / 1000, W = Math.max(p.width, 4) / 1000, T = Math.max(p.thickness, 4) / 1000;
      let base: THREE.Vector3;
      if (p.pos) base = new THREE.Vector3(p.pos.x / 1000, p.pos.y / 1000, p.pos.z / 1000);
      else {
        const c = gi % cols, r = Math.floor(gi / cols);
        base = new THREE.Vector3((c - cols / 2) * (L + 0.15), T / 2 + 0.02, (r - cols / 2) * (W + 0.15));
        gi++;
      }
      return { part: p, idx: idx + 1, base, dims: [L, T, W] };
    });
    const box = new THREE.Box3();
    placed.forEach((pp) => box.expandByPoint(pp.base));
    const center = box.getCenter(new THREE.Vector3());
    placed.forEach((pp) => pp.base.sub(center));
    return { placed, center };
  }, [parts]);
}

function PartMesh({ pp, explode, showLabels, selected, onSelect, wireframe }:
  { pp: PlacedPart; explode: number; showLabels: boolean; selected: boolean; onSelect: () => void; wireframe: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  const target = useMemo(() => {
    const dir = pp.base.clone();
    const len = dir.length() || 0.001;
    return pp.base.clone().add(dir.normalize().multiplyScalar(len * explode * 1.8));
  }, [pp.base, explode]);

  useFrame(() => {
    if (ref.current) ref.current.position.lerp(target, 0.18);
  });

  return (
    <mesh ref={ref} position={pp.base} onClick={(e) => { e.stopPropagation(); onSelect(); }}>
      <boxGeometry args={pp.dims} />
      <meshStandardMaterial color={pp.part.color} roughness={0.6} metalness={0.15} wireframe={wireframe} emissive={selected ? '#550000' : '#000000'} />
      <Edges color={selected ? '#ffd23a' : '#ff5a5a'} />
      {showLabels && (
        <Html center distanceFactor={6} position={[0, pp.dims[1] / 2 + 0.06, 0]} style={{ pointerEvents: 'none' }}>
          <div style={{ background: 'rgba(0,0,0,0.8)', border: '1px solid #ff0000', color: '#fff', font: '11px Inter', padding: '2px 6px', borderRadius: 6, boxShadow: '0 0 8px rgba(255,0,0,0.6)', whiteSpace: 'nowrap' }}>
            <b style={{ color: '#ff5a5a' }}>{pp.idx}</b> {pp.part.code} · {pp.part.length}×{pp.part.width}×{pp.part.thickness}
          </div>
        </Html>
      )}
    </mesh>
  );
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[5, 8, 6]} intensity={1.1} />
      <pointLight position={[-4, 3, -3]} intensity={30} color="#ff0000" />
      <pointLight position={[4, -1, 4]} intensity={20} color="#8b0000" />
    </>
  );
}

export function Designer3D({ startExploded = false }: { startExploded?: boolean }) {
  const t = useT();
  const proj = useCurrentProject();
  const [explode, setExplode] = useState(startExploded ? 0.6 : 0);
  const [labels, setLabels] = useState(startExploded);
  const [wire, setWire] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const controls = useRef<any>(null);
  const camRef = useRef<THREE.PerspectiveCamera | null>(null);

  const parts = proj?.parts ?? [];
  const { placed } = usePlacedParts(parts);
  const sel = placed.find((p) => p.idx === selected) || null;

  const setView = (v: string) => {
    const cam = camRef.current; if (!cam) return;
    const d = 4;
    const map: Record<string, [number, number, number]> = {
      front: [0, 0, d], side: [d, 0, 0], top: [0, d, 0.01], iso: [d * 0.7, d * 0.6, d * 0.7], reset: [3.2, 2.6, 4.2],
    };
    const [x, y, z] = map[v] || map.reset;
    cam.position.set(x, y, z);
    controls.current?.target.set(0, 0, 0);
    controls.current?.update();
  };

  return (
    <div className="flex flex-col xl:flex-row gap-4">
      <Card className="flex-1 p-2 relative" style={{ minHeight: '64vh' }}>
        <div className="w-full rounded-xl overflow-hidden" style={{ height: '64vh', background: 'radial-gradient(circle at 50% 30%, #1a0000, #000)' }}>
          <Canvas
            camera={{ position: [3.2, 2.6, 4.2], fov: 45 }}
            onCreated={({ camera }) => { camRef.current = camera as THREE.PerspectiveCamera; }}
            onPointerMissed={() => setSelected(null)}
          >
            <fog attach="fog" args={['#100000', 6, 26]} />
            <Lights />
            <Grid args={[20, 20]} cellColor="#440000" sectionColor="#ff0000" infiniteGrid fadeDistance={24} position={[0, -0.01, 0]} />
            {placed.map((pp) => (
              <PartMesh key={pp.part.id} pp={pp} explode={explode} showLabels={labels} wireframe={wire}
                selected={selected === pp.idx} onSelect={() => setSelected(pp.idx)} />
            ))}
            <OrbitControls ref={controls} enableDamping dampingFactor={0.08} autoRotate={autoRotate} autoRotateSpeed={1.6} minDistance={1} maxDistance={40} />
          </Canvas>
        </div>
        <div className="absolute top-3 left-3 flex gap-1 z-10">
          {['front', 'side', 'top', 'iso', 'reset'].map((v) => (
            <Button key={v} variant="tool" size="sm" onClick={() => setView(v)}>{v === 'reset' ? t('reset_view') : t(v)}</Button>
          ))}
        </div>
        <div className="absolute bottom-3 left-3 text-[10px] text-zinc-500 glass-soft px-2 py-1 rounded">Orbit · {parts.length} {t('pieces')}</div>
      </Card>

      <Card className="xl:w-72 p-4 space-y-4">
        <div>
          <div className="flex justify-between text-xs mb-1"><span className="text-zinc-300">{t('explode_factor')}</span><span className="text-red-300 font-bold">{Math.round(explode * 100)}%</span></div>
          <input type="range" min={0} max={100} value={Math.round(explode * 100)} onChange={(e) => setExplode(+e.target.value / 100)} className="w-full accent-red-600" />
          <div className="flex gap-2 mt-2">
            <Button variant="ghost" size="sm" className="flex-1" onClick={() => setExplode(0.7)}>{t('explode')}</Button>
            <Button variant="ghost" size="sm" className="flex-1" onClick={() => setExplode(0)}>{t('assemble')}</Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="tool" size="sm" data-active={autoRotate} onClick={() => setAutoRotate((v) => !v)}>{t('auto_rotate')}</Button>
          <Button variant="tool" size="sm" data-active={wire} onClick={() => setWire((v) => !v)}>{t('wireframe')}</Button>
          <Button variant="tool" size="sm" data-active={labels} onClick={() => setLabels((v) => !v)}>{t('dimensions')}</Button>
        </div>
        <div>
          <h3 className="font-display font-bold text-sm mb-2">{t('properties')}</h3>
          {sel ? (
            <div className="text-xs text-zinc-300 space-y-1">
              <div className="text-[10px] uppercase text-red-400">#{sel.idx} · {sel.part.code}</div>
              <div className="font-semibold text-sm">{sel.part.name}</div>
              <div>{t('length')}: {sel.part.length} mm</div>
              <div>{t('width')}: {sel.part.width} mm</div>
              <div>{t('thickness')}: {sel.part.thickness} mm</div>
              <div>{t('weight')}: {partTotals(sel.part).weight.toFixed(2)} kg</div>
            </div>
          ) : <p className="text-xs text-zinc-500">{t('tool_select')}…</p>}
        </div>
      </Card>
    </div>
  );
}

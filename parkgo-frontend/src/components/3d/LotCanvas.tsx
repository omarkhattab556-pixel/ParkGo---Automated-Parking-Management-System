import { Suspense, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment, Html } from '@react-three/drei';
import type { ParkingSpot3D } from './ParkingLot3D';
import type { Group } from 'three';

interface LotCanvasProps {
  spots: ParkingSpot3D[];
  cols: number;
  autoRotate: boolean;
  showcase: boolean;
  onSpotClick?: (spot: ParkingSpot3D) => void;
}

export default function LotCanvas({
  spots,
  cols,
  autoRotate,
  showcase,
  onSpotClick,
}: LotCanvasProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.8]}
      camera={{ position: [10, 11, 14], fov: 38 }}
      gl={{ antialias: true, alpha: true }}
      style={{ touchAction: 'none' }}
    >
      <Scene
        spots={spots}
        cols={cols}
        autoRotate={autoRotate}
        showcase={showcase}
        onSpotClick={onSpotClick}
      />
    </Canvas>
  );
}

function Scene({
  spots,
  cols,
  autoRotate,
  showcase,
  onSpotClick,
}: {
  spots: ParkingSpot3D[];
  cols: number;
  autoRotate: boolean;
  showcase: boolean;
  onSpotClick?: (spot: ParkingSpot3D) => void;
}) {
  const rows = Math.max(1, Math.ceil(spots.length / cols));
  const cellW = 1.0;
  const cellD = 1.7;
  const lotW = cols * cellW;
  const aisleEvery = 4;
  const totalAisles = Math.max(0, Math.floor((rows - 1) / aisleEvery));
  const lotD = rows * cellD + totalAisles * 0.6;

  const layout = useMemo(() => {
    const items: Array<{
      key: number;
      pos: [number, number, number];
      spot: ParkingSpot3D;
    }> = [];
    for (let i = 0; i < spots.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const aisleOffset = Math.floor(row / aisleEvery) * 0.6;
      const x = col * cellW - lotW / 2 + cellW / 2;
      const z = row * cellD - lotD / 2 + cellD / 2 + aisleOffset;
      items.push({ key: spots[i].space_number, pos: [x, 0, z], spot: spots[i] });
    }
    return items;
  }, [spots, cols, lotW, lotD]);

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight
        position={[10, 14, 8]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-8, 8, -4]} intensity={0.35} color="#8c84ff" />

      <Suspense fallback={null}>
        <Environment preset="city" />
      </Suspense>

      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <planeGeometry args={[lotW + 4, lotD + 4]} />
        <meshStandardMaterial color="#1a1a2a" metalness={0.1} roughness={0.85} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]}>
        <planeGeometry args={[lotW + 2, lotD + 2]} />
        <meshStandardMaterial color="#2d2d3d" metalness={0.05} roughness={0.95} />
      </mesh>

      {layout.map(({ key, pos, spot }) => (
        <Spot key={key} position={pos} spot={spot} onSpotClick={onSpotClick} />
      ))}

      <ContactShadows
        position={[0, 0, 0]}
        opacity={0.45}
        scale={lotW * 2.2}
        blur={2.4}
        far={6}
      />

      <OrbitControls
        enabled={!showcase}
        enablePan={false}
        enableZoom={!showcase}
        minDistance={8}
        maxDistance={26}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.2}
        autoRotate={autoRotate || showcase}
        autoRotateSpeed={showcase ? 0.8 : 0.55}
      />
    </>
  );
}

function Spot({
  position,
  spot,
  onSpotClick,
}: {
  position: [number, number, number];
  spot: ParkingSpot3D;
  onSpotClick?: (spot: ParkingSpot3D) => void;
}) {
  const groupRef = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);

  // A spot is clickable when staff can open the occupant's profile.
  const clickable = !!(onSpotClick && spot.occupant_id);

  let color = '#10b981';
  let emissive = '#10b981';
  let emissiveIntensity = 0.05;
  let isCar = false;

  if (spot.is_occupied) {
    color = '#f43f5e';
    emissive = '#f43f5e';
    emissiveIntensity = 0.15;
    isCar = true;
  } else if (spot.is_reserved) {
    color = '#f59e0b';
    emissive = '#f59e0b';
    emissiveIntensity = 0.18;
  }
  if (spot.is_mine) {
    color = '#5d52f7';
    emissive = '#5d52f7';
    emissiveIntensity = 0.45;
    isCar = true;
  }

  const yLift = hovered ? 0.15 : 0;

  return (
    <group
      ref={groupRef}
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = clickable ? 'pointer' : 'default';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = '';
      }}
      onClick={(e) => {
        if (!clickable) return;
        e.stopPropagation();
        onSpotClick?.(spot);
      }}
    >
      <mesh
        receiveShadow
        position={[0, 0.01 + yLift, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[0.9, 1.55]} />
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          metalness={0.1}
          roughness={0.6}
          transparent
          opacity={spot.is_occupied ? 0.35 : 0.65}
        />
      </mesh>

      <mesh position={[0, 0.02 + yLift, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.45, 0.47, 32]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.18} />
      </mesh>

      {isCar && (
        <group position={[0, 0.18 + yLift, 0]}>
          <mesh castShadow position={[0, 0.16, 0]}>
            <boxGeometry args={[0.7, 0.28, 1.35]} />
            <meshStandardMaterial color={color} metalness={0.55} roughness={0.35} />
          </mesh>
          <mesh castShadow position={[0, 0.42, -0.05]}>
            <boxGeometry args={[0.62, 0.22, 0.78]} />
            <meshStandardMaterial color={color} metalness={0.55} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.42, 0.36]} rotation={[Math.PI / 8, 0, 0]}>
            <boxGeometry args={[0.55, 0.18, 0.02]} />
            <meshStandardMaterial color="#0d0d18" metalness={0.9} roughness={0.1} />
          </mesh>
          {(
            [
              [-0.36, 0.1, 0.5],
              [0.36, 0.1, 0.5],
              [-0.36, 0.1, -0.5],
              [0.36, 0.1, -0.5],
            ] as Array<[number, number, number]>
          ).map((p, i) => (
            <mesh
              key={i}
              position={p}
              rotation={[0, 0, Math.PI / 2]}
              castShadow
            >
              <cylinderGeometry args={[0.1, 0.1, 0.08, 14]} />
              <meshStandardMaterial color="#0d0d18" metalness={0.4} roughness={0.6} />
            </mesh>
          ))}
        </group>
      )}

      {spot.is_mine && (
        <mesh position={[0, 1.3, 0]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial
            color="#5d52f7"
            emissive="#5d52f7"
            emissiveIntensity={1.5}
          />
        </mesh>
      )}

      {/* Occupant nameplate (manager/attendant view only) */}
      {hovered && spot.occupant_name && (
        <Html
          position={[0, 1.0 + yLift, 0]}
          center
          distanceFactor={9}
          zIndexRange={[100, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <div
            className="rounded-lg bg-ink-900/95 text-white px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap shadow-elevated border border-white/10"
            style={{ transform: 'translateY(-4px)' }}
          >
            <div className="text-[9px] uppercase tracking-wider text-white/60">
              Space #{spot.space_number}
            </div>
            <div>{spot.occupant_name}</div>
            {clickable && (
              <div className="text-[9px] text-brand-300 mt-0.5">
                Click to view profile →
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}

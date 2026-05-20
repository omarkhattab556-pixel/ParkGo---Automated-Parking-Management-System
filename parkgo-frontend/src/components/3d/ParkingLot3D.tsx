import { Suspense, lazy } from 'react';
import { cn } from '@/lib/utils';

const LotCanvas = lazy(() => import('./LotCanvas'));

/* ============================================================
   ParkingLot3D — Lightweight 3D visualization of the lot
   ============================================================ */

export interface ParkingSpot3D {
  /** 1-based space number */
  space_number: number;
  is_occupied: boolean;
  is_reserved?: boolean;
  is_mine?: boolean;
}

interface ParkingLot3DProps {
  spots: ParkingSpot3D[];
  /** Grid columns. The component lays out spaces in rows of `cols`. */
  cols?: number;
  className?: string;
  /** Auto-rotate the camera */
  autoRotate?: boolean;
  /** Hide camera controls and labels for a clean hero look */
  showcase?: boolean;
}

export function ParkingLot3D({
  spots,
  cols = 8,
  className,
  autoRotate = true,
  showcase = false,
}: ParkingLot3DProps) {
  return (
    <div className={cn('relative w-full h-full min-h-[280px]', className)}>
      <Suspense fallback={<LotFallback />}>
        <LotCanvas
          spots={spots}
          cols={cols}
          autoRotate={autoRotate}
          showcase={showcase}
        />
      </Suspense>

      {!showcase && (
        <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] font-medium text-ink-600 bg-white/85 backdrop-blur-md rounded-full px-3 py-1.5 border border-surface-200 shadow-soft pointer-events-none">
          <LegendDot color="#10b981" label="Free" />
          <LegendDot color="#f43f5e" label="Occupied" />
          <LegendDot color="#f59e0b" label="Reserved" />
          <LegendDot color="#5d52f7" label="You" glow />
        </div>
      )}
    </div>
  );
}

function LegendDot({
  color,
  label,
  glow,
}: {
  color: string;
  label: string;
  glow?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="h-2.5 w-2.5 rounded-full"
        style={{
          background: color,
          boxShadow: glow ? `0 0 10px ${color}` : undefined,
        }}
      />
      {label}
    </span>
  );
}

function LotFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-aurora-soft rounded-3xl">
      <div className="flex flex-col items-center gap-2 text-ink-500">
        <div className="h-10 w-10 rounded-full border-2 border-brand-300 border-t-brand-600 animate-spin" />
        <p className="text-xs font-medium">Loading 3D view…</p>
      </div>
    </div>
  );
}

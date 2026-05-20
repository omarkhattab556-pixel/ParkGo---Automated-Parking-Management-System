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

/**
 * View mode determines what data the spot reveals:
 *  - 'full'       — show occupied, reserved, mine. Default (manager view).
 *  - 'subscriber' — privacy: hide other subscribers' spots; only render
 *                   the user's own car (is_mine). All other spots render
 *                   as plain empty pads regardless of actual occupancy.
 *  - 'attendant'  — live state without reservation positions: occupied
 *                   shows as a car, reservations are NOT highlighted
 *                   (table view handles that). No "mine" marker.
 */
export type ParkingLotView = 'full' | 'subscriber' | 'attendant';

interface ParkingLot3DProps {
  spots: ParkingSpot3D[];
  /** Grid columns. The component lays out spaces in rows of `cols`. */
  cols?: number;
  className?: string;
  /** Auto-rotate the camera */
  autoRotate?: boolean;
  /** Hide camera controls and labels for a clean hero look */
  showcase?: boolean;
  view?: ParkingLotView;
}

export function ParkingLot3D({
  spots,
  cols = 8,
  className,
  autoRotate = true,
  showcase = false,
  view = 'full',
}: ParkingLot3DProps) {
  // Apply privacy filtering based on the view mode.
  const filtered = spots.map((s) => {
    if (view === 'subscriber') {
      // Show ONLY my own spot as a car; everything else is a blank pad.
      if (s.is_mine) return s;
      return {
        space_number: s.space_number,
        is_occupied: false,
        is_reserved: false,
        is_mine: false,
      };
    }
    if (view === 'attendant') {
      // Show occupied state (cars) but NO reservation markers and no "mine".
      return {
        space_number: s.space_number,
        is_occupied: s.is_occupied,
        is_reserved: false,
        is_mine: false,
      };
    }
    return s;
  });

  return (
    <div className={cn('relative w-full h-full min-h-[280px]', className)}>
      <Suspense fallback={<LotFallback />}>
        <LotCanvas
          spots={filtered}
          cols={cols}
          autoRotate={autoRotate}
          showcase={showcase}
        />
      </Suspense>

      {!showcase && (
        <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] font-medium text-ink-600 bg-white/85 backdrop-blur-md rounded-full px-3 py-1.5 border border-surface-200 shadow-soft pointer-events-none">
          <LegendDot color="#10b981" label="Free" />
          {view !== 'subscriber' && (
            <LegendDot color="#f43f5e" label="Occupied" />
          )}
          {view === 'full' && (
            <LegendDot color="#f59e0b" label="Reserved" />
          )}
          {view === 'subscriber' && (
            <LegendDot color="#5d52f7" label="You" glow />
          )}
          {view === 'full' && (
            <LegendDot color="#5d52f7" label="You" glow />
          )}
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

import { Suspense, lazy, useMemo, useState } from 'react';
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
  /** Location / floor label this spot lives on. */
  location?: string | null;
  /** Manager/attendant only: name of the subscriber occupying this spot. */
  occupant_name?: string;
}

/**
 * View mode determines what data the spot reveals:
 *  - 'full'       — show occupied, reserved, mine, occupant names. Manager/guard.
 *  - 'subscriber' — privacy: only render the user's own car. All other
 *                   spots render as blank pads.
 *  - 'attendant'  — live state without reservation positions or names.
 */
export type ParkingLotView = 'full' | 'subscriber' | 'attendant';

const UNZONED = 'Unzoned';
const locKey = (loc?: string | null) => (loc && loc.trim()) || UNZONED;

interface ParkingLot3DProps {
  spots: ParkingSpot3D[];
  /** Grid columns. */
  cols?: number;
  className?: string;
  autoRotate?: boolean;
  showcase?: boolean;
  view?: ParkingLotView;
  /**
   * Controlled location ("floor" label). If omitted, the component picks
   * the first location found in `spots` and offers a built-in switcher
   * when there are 2+ locations. Set explicitly (e.g. for the subscriber)
   * to lock the view to a single floor with no switcher.
   */
  location?: string | null;
  onLocationChange?: (location: string) => void;
  /** Disable the built-in floor switcher even when multiple floors exist. */
  hideFloorSwitcher?: boolean;
}

export function ParkingLot3D({
  spots,
  cols = 8,
  className,
  autoRotate = true,
  showcase = false,
  view = 'full',
  location,
  onLocationChange,
  hideFloorSwitcher = false,
}: ParkingLot3DProps) {
  const availableLocations = useMemo(() => {
    const set = new Set<string>();
    for (const s of spots) set.add(locKey(s.location));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [spots]);

  const [internalLocation, setInternalLocation] = useState<string | null>(null);
  const activeLocation =
    (location && locKey(location)) ??
    internalLocation ??
    availableLocations[0] ??
    UNZONED;

  const handleLocationClick = (loc: string) => {
    if (onLocationChange) onLocationChange(loc);
    else setInternalLocation(loc);
  };

  // Restrict to the active floor first, then apply privacy.
  const onFloor = spots.filter((s) => locKey(s.location) === activeLocation);
  const filtered = onFloor.map((s) => {
    if (view === 'subscriber') {
      if (s.is_mine) return s;
      return {
        space_number: s.space_number,
        is_occupied: false,
        is_reserved: false,
        is_mine: false,
        location: s.location,
      };
    }
    if (view === 'attendant') {
      // Hide reservation markers (table handles reservations), keep occupant names
      // so the guard sees who is currently parked.
      return {
        space_number: s.space_number,
        is_occupied: s.is_occupied,
        is_reserved: false,
        is_mine: false,
        location: s.location,
        occupant_name: s.occupant_name,
      };
    }
    return s;
  });

  const showSwitcher =
    !showcase &&
    !hideFloorSwitcher &&
    availableLocations.length > 1 &&
    view !== 'subscriber';

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

      {showSwitcher && (
        <div className="absolute top-3 left-3 flex items-center gap-1 bg-white/85 backdrop-blur-md rounded-full px-1.5 py-1 border border-surface-200 shadow-soft max-w-[90%] overflow-x-auto">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-ink-500 px-2">
            Floor
          </span>
          {availableLocations.map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => handleLocationClick(loc)}
              className={cn(
                'h-6 px-2.5 rounded-full text-[11px] font-bold transition whitespace-nowrap',
                activeLocation === loc
                  ? 'bg-brand-600 text-white shadow-soft'
                  : 'text-ink-700 hover:bg-surface-100'
              )}
            >
              {loc}
            </button>
          ))}
        </div>
      )}

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

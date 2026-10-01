import AngkotIcon from './AngkotIcon';
import BusIcon from './BusIcon';
import MotorcycleIcon from './MotorcycleIcon';
import TrainIcon from './TrainIcon';
import WalkingIcon from './WalkingIcon';

// Disamakan dengan slug moda di `src/lib/mock/transportModes.ts`:
// walking, angkot, bus, krl (→ train), ojek (→ motorcycle).
export type VehicleType = 'walking' | 'angkot' | 'bus' | 'train' | 'motorcycle';

interface VehicleIconProps {
  type: VehicleType;
  /** Class CSS untuk svg — dipakai agar semua ikon moda seragam ukurannya
   *  (mis. `h-[54px] w-[54px] shrink-0` mencegah svg menyusut di flex container). */
  className?: string;
}

const vehicleIcons = {
  walking: WalkingIcon,
  angkot: AngkotIcon,
  bus: BusIcon,
  train: TrainIcon,
  motorcycle: MotorcycleIcon,
};

export function VehicleIcon({ type, className }: VehicleIconProps) {
  const Icon = vehicleIcons[type];

  return <Icon className={className} />;
}

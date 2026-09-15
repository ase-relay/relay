import BusIcon from './BusIcon';
import MotorcycleIcon from './MotorcycleIcon';
import TrainIcon from './TrainIcon';

export type VehicleType = 'bus' | 'train' | 'motorcycle';

interface VehicleIconProps {
  type: VehicleType;
}

export function VehicleIcon({ type }: VehicleIconProps) {
  const Icon = {
    bus: BusIcon,
    train: TrainIcon,
    motorcycle: MotorcycleIcon,
  }[type];

  return <Icon />;
}

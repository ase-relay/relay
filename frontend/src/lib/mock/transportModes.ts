import { TransportMode } from '../types/route';

export const transportModes: TransportMode[] = [
  {
    id: 'walking',
    name: 'Jalan Kaki',
    icon: 'walking',
    colorHex: '#64748b',
  },
  {
    id: 'angkot',
    name: 'Angkot',
    icon: 'angkot',
    colorHex: '#f59e0b',
  },
  {
    id: 'bus',
    name: 'Bus/BRT',
    icon: 'bus',
    colorHex: '#3b82f6',
  },
  {
    id: 'krl',
    name: 'KRL Commuter',
    icon: 'train',
    colorHex: '#ef4444',
  },
  {
    id: 'ojek',
    name: 'Ojek Online',
    icon: 'motorcycle',
    colorHex: '#10b981',
  },
];

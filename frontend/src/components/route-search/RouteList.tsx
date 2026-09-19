import React from 'react';
import { RouteOption } from '@/lib/types/route';
import { RouteCard } from './RouteCard';

interface RouteListProps {
  routes: RouteOption[];
  selectedRouteId: string;
  onSelectRoute: (routeId: string) => void;
  sortBy: 'tercepat' | 'termurah' | 'minim_transit' | null;
}

export function RouteList({ routes, selectedRouteId, onSelectRoute, sortBy }: RouteListProps) {
  const sortedRoutes = [...routes].sort((a, b) => {
    if (sortBy === 'tercepat') {
      return a.totalDurationMinutes - b.totalDurationMinutes;
    } else if (sortBy === 'termurah') {
      return a.totalCost - b.totalCost;
    } else if (sortBy === 'minim_transit') {
      return a.transitCount - b.transitCount;
    }
    return 0;
  });

  return (
    <div className="space-y-3">
      {sortedRoutes.map((route) => (
        <RouteCard
          key={route.id}
          route={route}
          isSelected={route.id === selectedRouteId}
          onSelect={onSelectRoute}
        />
      ))}
    </div>
  );
}

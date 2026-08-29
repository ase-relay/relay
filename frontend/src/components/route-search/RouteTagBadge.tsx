import React from 'react';
import { RouteOption } from '@/lib/types/route';

interface RouteTagBadgeProps {
  tag: RouteOption['tag'];
}

export function RouteTagBadge({ tag }: RouteTagBadgeProps) {
  if (!tag) return null;

  const tagConfig = {
    tercepat: {
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      label: 'Tercepat'
    },
    termurah: {
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      label: 'Termurah'
    },
    minim_transit: {
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-600',
      label: 'Minim Transit'
    }
  };

  const config = tagConfig[tag];
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}>
      {config.label}
    </span>
  );
}

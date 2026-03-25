import React from 'react';

interface BadgeProps {
  variant: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export default function Badge({ variant, children, style }: BadgeProps) {
  return (
    <span className={`badge ${variant}`} style={style}>
      {children}
    </span>
  );
}

export const STATUS_LABEL: Record<string, string> = {
  transit: 'In Transit',
  delivered: 'Delivered',
  pending: 'Pending',
  delayed: 'Delayed',
  customs: 'Customs',
  new: 'New',
  reviewing: 'Reviewing',
  approved: 'Approved',
  converted: 'Converted',
  rejected: 'Rejected',
  active: 'Active',
  idle: 'Idle',
  maintenance: 'Maintenance',
  retired: 'Retired',
};

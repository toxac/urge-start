import {
  CalendarDays,
  Compass,
  Home,
  Network,
  UserRound,
} from 'lucide-react';

export const PLATFORM_NAV_ITEMS = [
  {
    label: 'Home',
    href: '/dashboard',
    icon: Home,
    exact: true,
  },
  {
    label: 'Program',
    href: '/program',
    icon: Compass,
  },
  {
    label: 'Community',
    href: '/community',
    icon: Network,
  },
  {
    label: 'Network',
    href: '/network',
    icon: Network,
  },
  {
    label: 'Events',
    href: '/events',
    icon: CalendarDays,
  },
];

export const PLATFORM_ACCOUNT_ITEMS = [
  {
    label: 'Profile',
    href: '/profile',
    icon: UserRound,
  },
];
export interface AppRoute {
  label: string
  path: string
  short: string
}

export const primaryRoutes: AppRoute[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    short: 'Live metrics and quick connects',
  },
  {
    label: 'Connections',
    path: '/connections',
    short: 'Manage servers, groups, and quick launches',
  },
  {
    label: 'Sessions',
    path: '/sessions',
    short: 'Ongoing activity with health indicators',
  },
  {
    label: 'Settings',
    path: '/settings',
    short: 'Security, auth, and deployment preferences',
  },
]

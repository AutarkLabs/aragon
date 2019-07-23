import React from 'react'
import {
  IconSettings,
  IconPermissions,
  IconApps,
  IconIdentity,
} from '@aragon/ui'
import AppIcon from './components/AppIcon/AppIcon'

const homeApp = {
  appId: 'home',
  name: 'Home',
  instances: [{ instanceId: 'home' }],
}

export const staticApps = new Map(
  Object.entries({
    apps: {
      app: {
        appId: 'apps',
        name: 'App Center',
        icon: <IconApps />,
        instances: [{ instanceId: 'apps' }],
      },
      route: '/apps',
    },
    home: {
      app: {
        ...homeApp,
        icon: <AppIcon app={homeApp} />,
      },
      route: '/',
    },
    permissions: {
      app: {
        appId: 'permissions',
        name: 'Permissions',
        icon: <IconPermissions />,
        instances: [{ instanceId: 'permissions' }],
      },
      route: '/permissions',
    },
    settings: {
      app: {
        appId: 'settings',
        name: 'Settings',
        icon: <IconSettings />,
        instances: [{ instanceId: 'settings' }],
      },
      route: '/settings',
    },
    profile: {
      app: {
        appId: 'profile',
        name: 'Profile',
        icon: <IconIdentity />,
        instances: [{ instanceId: 'profile' }],
      },
      route: '/profile',
    },
  })
)

export const isStaticApp = instanceId => {
  for (const { app } in staticApps) {
    if (app.appId === instanceId) {
      return true
    }
  }
  return false
}

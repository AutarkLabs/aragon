import React, { createContext, useContext, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { EthereumAddressType } from '../prop-types'
import { concat, fromEvent, from, merge } from 'rxjs'
import { concatMap, endWith, first, flatMap, startWith } from 'rxjs/operators'
import { getAppPath } from '../routing'
import { getAppIconBySize } from '../utils'

import forum from '../apps/Forum/abi/Forum.json'
import handleForumEvent from '../apps/Forum/store/events'

const APP_ABIS = { forum: forum.abi }
const APP_EVENTS = { forum: handleForumEvent }
const INITIAL_STATE = {
  forum: {
    threads: [],
    isSyncing: false,
  },
}

const ETHER_TOKEN_FAKE_ADDRESS = '0x0000000000000000000000000000000000000000'
const CACHED_STATE_KEY = 'CACHED_STATE_KEY'
const BLOCK_REORG_MARGIN = 100
const FORUM = 'forum'

export const AppContext = createContext({})

export function useAppState(app) {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppState must be used within a AppProvider')
  }
  const currentApp = app || context.locator.instanceId
  return context.appStates[currentApp]
}

export function useAragonApi(app) {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAragonApi must be used within a AppProvider')
  }
  const currentApp = app || context.locator.instanceId
  const { methods, api } = new context.AragonApi(currentApp)
  return {
    api: {
      ...methods,
      ...api,
    },
    appState: context.appStates[currentApp],
    connectedAccount: context.connectedAccount,
  }
}

export function useConnectedAccount() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useConnectedAccount must be used within a AppProvider')
  }
  return context.connectedAccount
}

export function useInstalledApps() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useInstalledApps must be used within a AppProvider')
  }
  return context.transformApps(context.installedApps)
}

export function useNetwork() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useNetwork must be used within a AppProvider')
  }
  return context.network
}

export function usePathHelpers() {
  function usePath() {
    const context = useContext(AppContext)
    if (!context) {
      throw new Error('usePath must be used within a AppProvider')
    }
    return [
      context.locator.instancePath,
      newPath => {
        const truncPath =
          newPath.charAt(0) === '/' ? newPath.substr(1) : newPath
        context.historyPush(
          `${getAppPath({
            dao: context.locator.dao,
            instanceId: context.locator.instanceId,
          })}${truncPath}`
        )
      },
    ]
  }

  const [path, requestPath] = usePath()

  const history = []

  React.useEffect(() => {
    if (path !== history[history.length - 1]) {
      history.push(path)
    }
  }, [history, path])

  // Since goBack is not supported in aragonAPI, we do not have access to
  // actual browser history. If the user refreshes their page then fires a
  // `goBack` action, we will have nothing in our custom `history` array.
  // The `fallback` option allows us to work around this.
  const goBack = React.useCallback(
    (fallback = '/') => {
      history.pop() // remove current page, forget about it (goForward not supported)
      const prev = history.pop()
      requestPath(prev || fallback)
    },
    [history, requestPath]
  )

  // accepts a pattern like '/budgets/:id', where ':id' is a named parameter
  // redirects to '/' if the current path doesn't match at all
  // otherwise, returns an object with keys matching the named parameters and
  // values filled in from the current path
  const parsePath = React.useCallback(
    pattern => {
      const namedParameters = pattern.match(/(:[a-zA-Z]+)/g)

      // replace named paramaters with regex-compatible capture groups
      namedParameters.forEach(x => {
        pattern = pattern.replace(x, '([a-zA-Z0-9-+_!@#$%^&*=]+)')
      })

      const matchData = path.match(pattern)
      if (!matchData) return {}

      const groups = namedParameters.reduce((acc, namedParameter, index) => {
        acc[namedParameter.slice(1)] = matchData[index + 1]
        return acc
      }, {})

      return groups
    },
    [path]
  )

  return { goBack, parsePath, requestPath }
}

export const AppProvider = ({
  apps,
  handleIdentityResolve,
  handleOpenLocalIdentityModal,
  historyPush,
  locator,
  network,
  walletAccount,
  web3,
  wrapper,
  children,
}) => {
  const [connectedAccount, setConnectedAccount] = useState(walletAccount)
  const [initializationBlock, setInitializationBlock] = useState(0)
  const [latestBlock, setLatestBlock] = useState(0)
  const [initialized, setInitialized] = useState(false)
  const [appAddresses, setAppAddresses] = useState({})
  const [appState, setAppState] = useState(INITIAL_STATE)
  const [installedApps, setInstalledApps] = useState(apps)

  class AragonApi {
    constructor(app) {
      this.app = app
      this.contract = new web3.eth.Contract(APP_ABIS[app], appAddresses[app])
      this.methods = {}
      // Bind calls
      const callMethods = APP_ABIS[app].filter(
        item => item.type === 'function' && item.constant
      )
      callMethods.forEach(callMethod => {
        this.methods[callMethod.name] = (...params) => {
          const lastParam = params[params.length - 1]

          return typeof lastParam === 'object' && lastParam !== null
            ? from(
                this.contract.methods[callMethod.name](
                  ...params.slice(0, -1)
                ).call(lastParam)
              )
            : from(this.contract.methods[callMethod.name](...params).call())
        }
      })
      // Bind intents
      const intentMethods = APP_ABIS[app].filter(
        item => item.type === 'function' && !item.constant
      )
      intentMethods.forEach(intentMethod => {
        this.methods[intentMethod.name] = (...params) => {
          return from(
            new Promise((resolve, reject) => {
              wrapper
                .getExternalTransactionPath(
                  appAddresses[app],
                  intentMethod,
                  params
                )
                .then(
                  result => resolve(wrapper.performTransactionPath(result)),
                  error => reject(error)
                )
                .catch(error => reject(error))
            })
          )
        }
      })
    }

    api = {
      cache: (key, value) => {
        return from(
          wrapper.cache.set(getCacheKey(appAddresses[this.app], key), value)
        )
      },
      call: (method, ...params) => {
        const lastParam = params[params.length - 1]

        return typeof lastParam === 'object' && lastParam !== null
          ? from(
              this.contract.methods[method](...params.slice(0, -1)).call(
                lastParam
              )
            )
          : from(this.contract.methods[method](...params).call())
      },
      currentApp: () => {
        return from(
          new Promise((resolve, reject) => {
            try {
              const currentApp = transformApps(installedApps).find(
                app => app.appAddress === appAddresses[this.app]
              )
              resolve(currentApp)
            } catch (error) {
              reject(error)
            }
          })
        )
      },
      datastore: (method, value) => {
        return from(wrapper.datastore[method](value))
      },
      describeScript: script => {
        return from(handleDescribeScript(script))
      },
      emitTrigger: async (event, returnValues) => {
        /*
          Currently this function assumes that each app's event handler takes the
          same input. As we add more apps we will have to decide whether to
          standardize the inputs or have bunch of if statements for each event
          handler.
        */
        const newState = await APP_EVENTS[this.app](
          this.api, // App object used in script.js functions
          {
            state: appState[this.app],
            event: { event, returnValues },
            settings: {
              ethToken: { address: ETHER_TOKEN_FAKE_ADDRESS },
              network,
            },
          }
        )
        const states = { ...appState }
        states[this.app] = newState
        setAppState(states)
        const cachedState = await this.api
          .getCache(CACHED_STATE_KEY)
          .toPromise()
        this.api.cache(CACHED_STATE_KEY, {
          block: cachedState ? cachedState.block : 0,
          state: newState,
        })
      },
      external: (address, abi) => {
        const contract = new web3.eth.Contract(abi, address)
        const externalContract = {}
        // Bind calls
        const callMethods = abi.filter(
          item => item.type === 'function' && item.constant
        )
        callMethods.forEach(callMethod => {
          externalContract[callMethod.name] = (...params) => {
            const lastParam = params[params.length - 1]

            return typeof lastParam === 'object' && lastParam !== null
              ? from(
                  contract.methods[callMethod.name](
                    ...params.slice(0, -1)
                  ).call(lastParam)
                )
              : from(contract.methods[callMethod.name](...params).call())
          }
        })
        // Bind intents
        const intentMethods = abi.filter(
          item => item.type === 'function' && !item.constant
        )
        intentMethods.forEach(intentMethod => {
          externalContract[intentMethod.name] = (...params) => {
            return from(
              new Promise((resolve, reject) => {
                wrapper
                  .getExternalTransactionPath(address, intentMethod, params)
                  .then(
                    result =>
                      resolve(
                        wrapper.performTransactionPath(result, {
                          external: true,
                        })
                      ),
                    error => reject(error)
                  )
                  .catch(error => reject(error))
              })
            )
          }
        })

        return externalContract
      },
      getCache: key =>
        from(wrapper.cache.get(getCacheKey(appAddresses[this.app], key))),
      installedApps: () => {
        return from(
          new Promise((resolve, reject) => {
            try {
              const transformedApps = transformApps(installedApps)
              resolve(transformedApps)
            } catch (error) {
              reject(error)
            }
          })
        )
      },
      identify: identifier => {
        return from(
          wrapper.setAppIdentifier(appAddresses[this.app], identifier)
        )
      },
      resolveAddressIdentity: address => {
        return from(handleIdentityResolve(address))
      },
      requestAddressIdentityModification: address => {
        return from(
          new Promise(resolve => resolve(handleOpenLocalIdentityModal(address)))
        )
      },
      searchIdentities: searchTerm => {
        return from(wrapper.searchIdentities(searchTerm))
      },
      web3Eth: (method, ...params) => {
        return from(web3.eth[method](...params))
      },
    }
  }

  // Refresh state on wrapper change
  useEffect(() => {
    if (!wrapper && initialized) {
      setInitializationBlock(0)
      setInitialized(false)
      setAppState(INITIAL_STATE)
      setAppAddresses({})
    }
  }, [initialized, wrapper])

  // Update connected account
  useEffect(() => {
    if (walletAccount && walletAccount !== connectedAccount) {
      setConnectedAccount(walletAccount)
    }
  }, [connectedAccount, setConnectedAccount, walletAccount])

  // Get latest block
  useEffect(() => {
    const fetchLatestBlock = async () => {
      const block = await web3.eth.getBlockNumber()
      setLatestBlock(block)
    }

    if (!latestBlock) fetchLatestBlock()
  })

  // Get app addresses
  useEffect(() => {
    function resolveAppAddress(appName) {
      const thisApp = installedApps.find(
        app => app.name && app.name.toLowerCase().replace(' ', '') === appName
      )
      return thisApp ? thisApp.proxyAddress : null
    }
    if (installedApps.length && !initialized) {
      const addresses = {}
      addresses[FORUM] = resolveAppAddress(FORUM)
      setAppAddresses(addresses)
    }
  }, [initialized, installedApps])

  useEffect(() => {
    if (apps.length > installedApps.length) {
      setInstalledApps(apps)
    }
  }, [apps, installedApps, setInstalledApps])

  // Sync app states
  useEffect(() => {
    let states = { ...appState }

    const initializeApp = async ({ app, contracts, initState }) => {
      const { api } = new AragonApi(app)
      const settings = {
        ethToken: { address: ETHER_TOKEN_FAKE_ADDRESS },
        network,
      }
      const cachedState = await api.getCache(CACHED_STATE_KEY).toPromise()
      const toBlock = Math.max(0, latestBlock - BLOCK_REORG_MARGIN)
      const fromBlock = cachedState ? cachedState.block : initializationBlock
      let newState
      if (cachedState) {
        newState = cachedState.state
      } else {
        newState = initState
          ? await initState({
              api,
              state: appState[app],
              settings,
            })
          : appState[app]
      }
      getEvents(contracts, fromBlock, toBlock)
        .pipe(
          concatMap(event => {
            return new Promise((resolve, reject) => {
              APP_EVENTS[app](api, {
                event,
                settings,
                state: newState,
              })
                .then(
                  result => {
                    return resolve({
                      event,
                      state: result,
                    })
                  },
                  error => {
                    return reject(error)
                  }
                )
                .catch(error => reject(error))
            })
          })
        )
        .subscribe(response => {
          newState = response.state
          if (response.event.event === 'SYNC_STATUS_SYNCED') {
            const cachedState = {
              block: toBlock,
              state: response.state,
            }
            api.cache(CACHED_STATE_KEY, cachedState)
          }
          states[app] = response.state
          setAppState({ ...states })
          api.cache('state', response.state)
        })
    }

    // Sync forum state
    const syncForumState = async () => {
      const forumContract = new web3.eth.Contract(
        APP_ABIS[FORUM],
        appAddresses[FORUM]
      )

      initializeApp({
        app: FORUM,
        contracts: [forumContract],
      })
    }

    if (
      Object.keys(appAddresses).length &&
      appAddresses[FORUM] &&
      network &&
      wrapper &&
      latestBlock &&
      // initializationBlock &&
      !initialized
    ) {
      setInitialized(true)
      syncForumState()
      console.log('app addresses', appAddresses)
      console.log('initi')
    }
  }, [
    appAddresses,
    network,
    initializationBlock,
    wrapper,
    appState,
    latestBlock,
    initialized,
    web3.eth.Contract,
    AragonApi,
  ])

  const getEvents = (contracts, fromBlock, toBlock) => {
    const pastEvents = merge(
      ...contracts.map(contract => {
        return from(
          contract.getPastEvents('allEvents', {
            fromBlock: fromBlock,
            toBlock: toBlock,
          })
        )
      })
    ).pipe(
      // single emission array of all pastEvents -> flatten to process events
      flatMap(pastEvents => from(pastEvents)),
      startWith({
        event: 'SYNC_STATUS_SYNCING',
        returnValues: {
          from: fromBlock,
          to: toBlock,
        },
      }),
      endWith({
        event: 'SYNC_STATUS_SYNCED',
        returnValues: {},
      })
    )
    const events = merge(
      ...contracts.map(contract => {
        return fromEvent(
          contract.events.allEvents({ fromBlock: toBlock + 1 }),
          'data'
        )
      })
    )
    return concat(pastEvents, events)
  }

  const getCacheKey = (address, location) => {
    return `${address}.${location}`
  }

  const handleDescribeScript = async script => {
    const describedPath = await wrapper.describeTransactionPath(
      wrapper.decodeTransactionPath(script)
    )

    // Add name and identifier decoration
    const identifiers = await wrapper.appIdentifiers.pipe(first()).toPromise()
    return Promise.all(
      describedPath.map(async step => {
        const app = await wrapper.getApp(step.to)

        if (app) {
          return {
            ...step,
            identifier: identifiers[step.to],
            name: app.name,
          }
        }

        return step
      })
    )
  }

  const transformApps = apps => {
    // Extract just a few important details about the current app to decrease API surface area
    function transformAppInformation(app = {}, getContentPathFn) {
      const {
        appId,
        content,
        contractAddress,
        icons,
        identifier,
        isForwarder,
        kernelAddress,
        name,
        proxyAddress,
      } = app

      let icon, iconsWithBaseUrl
      if (getContentPathFn) {
        try {
          iconsWithBaseUrl = icons.map(icon => ({
            ...icon,
            src: getContentPathFn(content, icon.src),
          }))
        } catch (_) {}

        icon = (size = -1) => {
          const iconObj = getAppIconBySize(iconsWithBaseUrl, size)
          if (iconObj && iconObj.src) {
            return iconObj.src
          }
        }
      } else {
        icon = size => {
          return null
        }
      }

      return {
        icon,
        icons: iconsWithBaseUrl,
        identifier,
        kernelAddress,
        name,
        appAddress: proxyAddress,
        appId: appId,
        appImplementationAddress: contractAddress,
        isForwarder: Boolean(isForwarder),
      }
    }
    let getContentPath
    if (wrapper) getContentPath = wrapper.apm.getContentPath
    return apps.map(app => transformAppInformation(app, getContentPath))
  }

  return (
    <AppContext.Provider
      value={{
        AragonApi,
        appStates: appState,
        installedApps,
        network,
        transformApps,
        historyPush,
        locator,
        connectedAccount,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

AppProvider.propTypes = {
  apps: PropTypes.array.isRequired,
  handleIdentityResolve: PropTypes.func.isRequired,
  handleOpenLocalIdentityModal: PropTypes.func.isRequired,
  historyPush: PropTypes.func.isRequired,
  locator: PropTypes.object.isRequired,
  network: PropTypes.object.isRequired,
  walletAccount: EthereumAddressType,
  web3: PropTypes.object.isRequired,
  wrapper: PropTypes.object,
  children: PropTypes.node.isRequired,
}

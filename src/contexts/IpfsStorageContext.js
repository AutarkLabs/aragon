import React, {
  useReducer,
  createContext,
  useEffect,
  useCallback,
  useState,
} from 'react'
import PropTypes from 'prop-types'
import { instantiateStorageContract, Quasar } from '../storage'
import { AppType, AragonType } from '../prop-types'
import { appIds } from '../environment'

export const IPFSStorageContext = createContext({})

const quasarApi = new Quasar('https://quasar.autark.xyz:3002/api/v0')

const NO_STORAGE_APP_INSTALLED = 'noStorageAppInstalled'
const IPFS_PROVIDER_CONNECTION_SUCCESS = 'ipfsProviderConnectionSuccess'
const IPFS_PROVIDER_CONNECTION_FAILURE = 'ipfsProviderConnectionFailure'
const IPFS_PROVIDER_CONNECTING = 'ipfsProviderConnecting'

const initialStorageContextValue = {
  isStorageAppInstalled: null,
  ipfsEndpoints: null,
  [IPFS_PROVIDER_CONNECTING]: false,
  [IPFS_PROVIDER_CONNECTION_SUCCESS]: false,
  [IPFS_PROVIDER_CONNECTION_FAILURE]: false,
  error: null,
}

const reducer = (state, action) => {
  switch (action.type) {
    case NO_STORAGE_APP_INSTALLED:
      return {
        ...initialStorageContextValue,
        isStorageAppInstalled: false,
      }
    case IPFS_PROVIDER_CONNECTION_SUCCESS:
      return {
        ...state,
        ipfsEndpoints: action.payload.ipfsEndpoints,
        [IPFS_PROVIDER_CONNECTING]: false,
        [IPFS_PROVIDER_CONNECTION_SUCCESS]: true,
        [IPFS_PROVIDER_CONNECTION_FAILURE]: false,
        isStorageAppInstalled: true,
      }
    case IPFS_PROVIDER_CONNECTION_FAILURE:
      return {
        ...state,
        ipfsEndpoints: null,
        [IPFS_PROVIDER_CONNECTING]: false,
        [IPFS_PROVIDER_CONNECTION_SUCCESS]: false,
        [IPFS_PROVIDER_CONNECTION_FAILURE]: true,
        error: action.error,
        isStorageAppInstalled: true,
      }
    case IPFS_PROVIDER_CONNECTING:
      return {
        ...state,
        ipfsEndpoints: null,
        [IPFS_PROVIDER_CONNECTING]: true,
        [IPFS_PROVIDER_CONNECTION_SUCCESS]: false,
        [IPFS_PROVIDER_CONNECTION_FAILURE]: false,
      }
    default:
      return state
  }
}

export const connectionSuccess = ipfsEndpoints => ({
  type: IPFS_PROVIDER_CONNECTION_SUCCESS,
  payload: {
    ipfsEndpoints,
  },
})

export const connectionFailure = error => ({
  type: IPFS_PROVIDER_CONNECTION_FAILURE,
  error,
})

export const connecting = () => ({
  type: IPFS_PROVIDER_CONNECTING,
})

const noStorageApp = () => ({
  type: NO_STORAGE_APP_INSTALLED,
})

export const IPFSStorageProvider = ({ children, apps, wrapper }) => {
  const [ipfsStore, dispatchToIpfsStore] = useReducer(
    reducer,
    initialStorageContextValue
  )
  const [storageContract, setStorageContract] = useState({})

  // dag helpers
  const setDagInOrgDataStore = useCallback(
    (key, dag) => {
      if (!ipfsStore.isStorageAppInstalled) {
        throw new Error('No storage app installed')
      }
      if (typeof dag !== 'object') {
        throw new Error('type of value param must be object')
      }
      const set = async () => {
        const cid = await ipfsStore.ipfsEndpoints.dag.put(dag)
        await storageContract.registerData(
          wrapper.web3.utils.fromAscii(key),
          cid
        )
      }
      return set()
    },
    [
      ipfsStore.isStorageAppInstalled,
      ipfsStore.ipfsEndpoints,
      storageContract,
      wrapper,
    ]
  )

  const getDagFromOrgDataStore = useCallback(
    key => {
      const get = async () => {
        if (!ipfsStore.isStorageAppInstalled) {
          throw new Error('No storage app installed')
        }
        const cid = await storageContract.getRegisteredData(
          wrapper.web3.utils.fromAscii(key)
        )
        if (!cid) return null
        return ipfsStore.ipfsEndpoints.dag.get(cid)
      }
      return get()
    },
    [ipfsStore, storageContract, wrapper]
  )

  // file helpers
  const setFileInOrgDataStore = useCallback(
    (key, file) => {
      if (!ipfsStore.isStorageAppInstalled) {
        throw new Error('No storage app installed')
      }
      const set = async () => {
        const cid = await ipfsStore.ipfsEndpoints.add(file)
        await storageContract.registerData(
          wrapper.web3.utils.fromAscii(key),
          cid
        )
      }
      return set()
    },
    [
      ipfsStore.isStorageAppInstalled,
      ipfsStore.ipfsEndpoints,
      storageContract,
      wrapper,
    ]
  )

  const getFileFromOrgDataStore = useCallback(
    key => {
      const get = async () => {
        if (!ipfsStore.isStorageAppInstalled) {
          throw new Error('No storage app installed')
        }
        const cid = await storageContract.getRegisteredData(
          wrapper.web3.utils.fromAscii(key)
        )
        if (!cid) return null
        return ipfsStore.ipfsEndpoints.cat(cid)
      }
      return get()
    },
    [ipfsStore, storageContract, wrapper]
  )

  useEffect(() => {
    const getStorageProvider = async () => {
      dispatchToIpfsStore(connecting())
      try {
        const appAddressNameSpace = await wrapper.kernelProxy.call(
          'APP_ADDR_NAMESPACE'
        )
        const defaultStorageAppProxyAddress = await wrapper.kernelProxy.call(
          'getApp',
          appAddressNameSpace,
          appIds.Storage
        )
        const storageApp = apps.find(
          ({ proxyAddress }) =>
            proxyAddress.toLowerCase() ===
            defaultStorageAppProxyAddress.toLowerCase()
        )
        if (!storageApp) {
          dispatchToIpfsStore(noStorageApp())
        } else {
          const storageContract = instantiateStorageContract(
            storageApp.proxyAddress,
            storageApp.abi,
            wrapper
          )
          await quasarApi.listenToStorageContract(storageApp.proxyAddress)
          setStorageContract(storageContract)
          dispatchToIpfsStore(
            connectionSuccess(await quasarApi.createIpfsProvider())
          )
        }
      } catch (error) {
        dispatchToIpfsStore(connectionFailure(error))
      }
    }
    // ensure we don't continuously fetch the provider if the hook is used in multiple components
    if (
      !ipfsStore.ipfsProviderConnectionSuccess &&
      !ipfsStore.ipfsProviderConnecting
    ) {
      getStorageProvider()
    }
  }, [
    wrapper,
    apps,
    ipfsStore.ipfsProviderConnectionSuccess,
    ipfsStore.ipfsProviderConnecting,
  ])

  return (
    <IPFSStorageContext.Provider
      value={{
        ...ipfsStore,
        setDagInOrgDataStore,
        getDagFromOrgDataStore,
        setFileInOrgDataStore,
        getFileFromOrgDataStore,
      }}
    >
      {children}
    </IPFSStorageContext.Provider>
  )
}

IPFSStorageProvider.propTypes = {
  apps: PropTypes.arrayOf(AppType),
  children: PropTypes.node.isRequired,
  wrapper: AragonType,
}

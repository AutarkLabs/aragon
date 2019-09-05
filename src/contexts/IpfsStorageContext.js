import React, {
  useReducer,
  createContext,
  useEffect,
  useCallback,
  useState,
} from 'react'
import PropTypes from 'prop-types'
import { instantiateStorageContract } from '../storage/storage-wrapper'
import { AppType, AragonType } from '../prop-types'

export const IPFSStorageContext = createContext({})

const NO_STORAGE_APP_INSTALLED = 'noStorageAppInstalled'
const IPFS_PROVIDER_CONNECTION_SUCCESS = 'ipfsProviderConnectionSuccess'
const IPFS_PROVIDER_CONNECTION_FAILURE = 'ipfsProviderConnectionFailure'
const IPFS_PROVIDER_CONNECTING = 'ipfsProviderConnecting'
const IPFS_PROVIDER_FOUND = 'ipfsProviderFound'

const initialStorageContextValue = {
  isStorageAppInstalled: null,
  ipfsEndpoints: null,
  [IPFS_PROVIDER_CONNECTING]: false,
  [IPFS_PROVIDER_CONNECTION_SUCCESS]: false,
  [IPFS_PROVIDER_CONNECTION_FAILURE]: false,
  error: null,
}

const storeInCache = (wrapper, key, value) => {
  return wrapper.cache.set(key, value)
}

const getFromCache = (wrapper, key) => {
  return wrapper.cache.observe(key)
}

const createIpfsProvider = async (
  provider,
  uri = '',
  providerKey = '',
  providerSecret = ''
) => {
  switch (provider.toLowerCase()) {
    case 'pinata':
      return getPinataNode(providerKey, providerSecret)
    case 'infura':
      return getInfuraNode()
    case 'temporal':
      return getTemporalNode(providerKey, providerSecret)
  }
}

const pinataAuthUrl = `https://api.pinata.cloud/data/testAuthentication`
const temporalAuthUrl = `https://api.temporal.cloud/v2/auth/login`

const getPinataNode = async (key, secret) => {
  await fetch(pinataAuthUrl, {
    method: 'GET',
    headers: {
      pinata_api_key: key,
      pinata_secret_api_key: secret,
    },
  })
  return pinataNode(key, secret)
}

const pinataNode = (key, secret) => {
  const pinataPutEndpoint = `https://api.pinata.cloud/pinning/pinJSONToIPFS`
  const pinataDagGetEndpoint = `https://api.pinata.cloud/data/pinList`

  return {
    dagGet: async () => {
      const response = await fetch(pinataDagGetEndpoint, {
        method: 'GET',
        headers: {
          pinata_api_key: key,
          pinata_secret_api_key: secret,
        },
      })
      return response.json()
    },
    dagPut: async json => {
      const response = await fetch(pinataPutEndpoint, {
        method: 'POST',
        headers: {
          pinata_api_key: key,
          pinata_secret_api_key: secret,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pinataContent: json }),
      })
      return response.json()
    },
  }
}

const getInfuraNode = () => {
  const getEndpoint = `https://ipfs.infura.io:5001/api/v0/dag/get?arg=`
  const putEndpoint = `https://ipfs.infura.io:5001/api/v0/dag/put`

  return {
    dagGet: async hash => {
      const url = `${getEndpoint}${hash}`
      const response = await fetch(url, {
        method: 'GET',
      })
      return response.json()
    },
    dagPut: async json => {
      let data = new FormData()
      data.append('v0', JSON.stringify(json))
      const response = await fetch(putEndpoint, {
        method: 'POST',
        body: data,
      })
      return response.json()
    },
  }
}
const getTemporalNode = async (username, password) => {
  const getEndpoint = `https://api.temporal.cloud/v2/ipfs/public/dag/`
  const putEndpoint = `https://api.temporal.cloud/v2/ipfs/public/file/add`

  const authData = await fetch(temporalAuthUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
    },
    body: JSON.stringify({
      username: username,
      password: password,
    }),
  })
  const { token } = await authData.json()

  return {
    dagGet: async hash => {
      const url = `${getEndpoint}${hash}`
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + token,
        },
      })
      return response.json()
    },
    dagPut: async json => {
      let blob = new Blob([JSON.stringify([json])], {
        type: 'application/json',
      })

      let formData = new FormData()
      formData.append('hold_time', '1')
      formData.append('file', blob)
      const response = await fetch(putEndpoint, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + token,
        },
        body: formData,
      })
      return response.json()
    },
  }
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
      }
    case IPFS_PROVIDER_CONNECTION_FAILURE:
      return {
        ...state,
        ipfsEndpoints: null,
        [IPFS_PROVIDER_CONNECTING]: false,
        [IPFS_PROVIDER_CONNECTION_SUCCESS]: false,
        [IPFS_PROVIDER_CONNECTION_FAILURE]: true,
        error: action.error,
      }
    case IPFS_PROVIDER_CONNECTING:
      return {
        ...state,
        ipfsEndpoints: null,
        [IPFS_PROVIDER_CONNECTING]: true,
        [IPFS_PROVIDER_CONNECTION_SUCCESS]: false,
        [IPFS_PROVIDER_CONNECTION_FAILURE]: false,
      }
    case IPFS_PROVIDER_FOUND:
      return {
        ...state,
        ipfsProviderName: action.payload.provider,
        ipfsProviderUri: action.payload.uri,
      }
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

export const providerFound = (provider, uri) => ({
  type: IPFS_PROVIDER_FOUND,
  payload: {
    provider,
    uri,
  },
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
  const storageApp = apps.find(({ name }) => name === 'Storage')

  const updateIpfsProvider = useCallback(
    (provider, uri, providerKey, providerSecret) => {
      const update = async () => {
        try {
          storeInCache(wrapper, provider, {
            providerKey,
            providerSecret,
          })
          await storageContract.registerStorageProvider(provider, uri)
          dispatchToIpfsStore(providerFound(provider, uri))
          getFromCache(wrapper, provider).subscribe(
            async ({ providerKey = '', providerSecret = '' }) => {
              const ipfsEndpoints = await createIpfsProvider(
                provider,
                uri,
                providerKey,
                providerSecret
              )

              dispatchToIpfsStore(connectionSuccess(ipfsEndpoints))
            }
          )
        } catch (error) {
          dispatchToIpfsStore(connectionFailure(error))
        }
      }
      update()
    },
    [wrapper, storageContract]
  )

  useEffect(() => {
    const getStorageProvider = async storageApp => {
      try {
        const storageContract = instantiateStorageContract(
          storageApp.proxyAddress,
          wrapper
        )
        setStorageContract(storageContract)
        const res = await storageContract.getStorageProvider()
        const provider = res['0']
        const uri = res['1']
        dispatchToIpfsStore(providerFound(provider, uri))
        getFromCache(wrapper, provider).subscribe(
          async ({ providerKey, providerSecret }) => {
            const ipfsEndpoints = await createIpfsProvider(
              provider,
              uri,
              providerKey,
              providerSecret
            )

            dispatchToIpfsStore(connectionSuccess(ipfsEndpoints))
          }
        )
      } catch (error) {
        dispatchToIpfsStore(connectionFailure(error))
      }
    }

    if (storageApp) {
      dispatchToIpfsStore(connecting())
      getStorageProvider(storageApp)
    } else {
      dispatchToIpfsStore(noStorageApp())
    }
  }, [wrapper, storageApp])

  return (
    <IPFSStorageContext.Provider value={{ ...ipfsStore, updateIpfsProvider }}>
      {children}
    </IPFSStorageContext.Provider>
  )
}

IPFSStorageProvider.propTypes = {
  apps: PropTypes.arrayOf(AppType),
  children: PropTypes.node.isRequired,
  wrapper: AragonType,
}

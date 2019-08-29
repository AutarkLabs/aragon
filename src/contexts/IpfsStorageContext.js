import React, { useState, createContext, useEffect } from 'react'
import { instantiateStorageContract } from '../storage/storage-wrapper'

export const IPFSStorageContext = createContext({})

const initialStorageContextValue = {
  ipfsObj: null,
  connectingToIpfsObj: false,
  connectedToIpfsObjSuccessfully: false,
  connectedToIpfsObjFailure: false,
  storageContract: null,
}

const storeInCache = (wrapper, key, value) => {
  return wrapper.cache.set(key, value)
}

const getFromCache = (wrapper, key) => {
  return wrapper.cache.observe(key)
}

const getStorageProviderCreds = async (provider, wrapper) => {
  // const creds = await getFromCache(wrapper, provider).toPromise()
  const creds = {
    providerKey: '',
    providerSecret: '',
  }
  return {
    providerKey: creds.providerKey,
    providerSecret: creds.providerSecret,
  }
}

const createIpfsProvider = async (
  provider,
  uri,
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
    dagPut: async () => {
      let key = Math.random().toString()
      let val = Math.random().toString()
      let blob = new Blob([{ [key]: val }], {
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

export const IPFSStorageProvider = ({ children, apps, wrapper }) => {
  const [storageContextStore, setStorageContextStore] = useState(
    initialStorageContextValue
  )

  useEffect(() => {
    const getStorageProvider = async storageApp => {
      const contract = instantiateStorageContract(
        storageApp.proxyAddress,
        wrapper
      )
      const [provider, uri] = await contract.getStorageProvider()
      // get credentials from provider if there are any
      const { providerKey, providerSecret } = getStorageProviderCreds(wrapper)
      const ipfsProvider = await createIpfsProvider(
        provider,
        uri,
        providerKey,
        providerSecret
      )

      return ipfsProvider
    }
    const storageApp = apps.find(({ name }) => name === 'Storage')
    if (storageApp) {
      getStorageProvider(storageApp)
    }
  }, [apps, wrapper])

  return (
    <IPFSStorageContext.Provider value={{ storageContextStore }}>
      {children}
    </IPFSStorageContext.Provider>
  )
}

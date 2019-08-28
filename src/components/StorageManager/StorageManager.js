import React, { useState, createContext, useEffect } from 'react'
import { instantiateStorageContract } from '../../storage/storage-wrapper'

export const IPFSStorageContext = createContext({})

const initialStorageContextValue = {
  ipfsObj: null,
  connectingToIpfsObj: false,
  connectedToIpfsObjSuccessfully: false,
  connectedToIpfsObjFailure: false,
  storageContract: null,
}

const fetchAndConfigureAllTheThings = () => {
  return {
    ipfsObj: null,
    connectingToIpfsObj: true,
    connectedToIpfsObjSuccessfully: false,
    connectedToIpfsObjFailure: false,
    storageContract: null,
  }
}

const storeInCache = (wrapper, key, value) => {
  return wrapper.cache.set(key, value)
}

const getFromCache = (wrapper, key) => {
  return wrapper.cache.observe(key)
}

const createIpfsProvider = async (
  provider,
  providerId = '',
  providerSecret = ''
) => {
  switch (provider) {
    case 'pinata':
      return getPinataNode(providerId, providerSecret)
    case 'infura':
      return getInfuraNode()
    case 'temporal':
      return getTemporalNode(providerId, providerSecret)
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

  const storageApp = apps.find(({ name }) => name === 'Storage')

  if (storageApp) {
    storeInCache(wrapper, 'zach', 'Gareth11').then(res => {
      console.log('res', res)
    })

    getFromCache(wrapper, 'zach').subscribe({
      next(x) { console.log('got value ' + x); },
      error(err) { console.error('something wrong occurred: ' + err); },
      complete() { console.log('done'); }
    });

    const contract = instantiateStorageContract(
      storageApp.proxyAddress,
      wrapper
    )

    contract.getStorageProvider().then(res => {
      console.log('res', res)
    })

    // Stubbing in creds
    createIpfsProvider('temporal', 'zach', 'Gareth11').then(res => {
      console.log('res', res)
    })
  }

  // useEffect(() => {
  //   const storage = fetchAndConfigureAllTheThings() // fetch and configure all the necessary things
  //   setStorageContextStore(storage)
  // }, [])

  return (
    <IPFSStorageContext.Provider value={{ storageContextStore }}>
      {children}
    </IPFSStorageContext.Provider>
  )
}

const url = `https://api.pinata.cloud/data/testAuthentication`

export const storeInCache = (wrapper, key, value) => {
  return wrapper.cache.set(key, value)
}

export const getFromCache = (wrapper, key) => {
  return wrapper.cache.observe(key)
}

export const createIpfsProvider = (provider, providerKey, providerSecret) => {
  switch (provider) {
    case 'pinata':
      getPinataNode()
      break
  }
}

const getPinataNode = (key, secret) => {
  fetch(url, {
    method: 'GET',
    headers: {
      pinata_api_key: key,
      pinata_secret_api_key: secret,
    },
  })
    .then(data => {
      console.log(data)
      return data
    })
    .catch(error => {
      console.log(error)
      return error
    })
}

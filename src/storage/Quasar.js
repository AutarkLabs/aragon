class Quasar {
  constructor(quasarEndpoint, ignoreQuasar = false) {
    this.ignoreQuasar = ignoreQuasar
    this.quasarEndpoint = quasarEndpoint
    this.ipfs = null
  }

  listenToStorageContract = async contractAddress => {
    if (this.ignoreQuasar) {
      return Promise.resolve()
    }
    try {
      const response = await fetch(`${this.quasarEndpoint}/contracts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contractAddress }),
      })
      return response.status === 201 || response.status === 204
    } catch (err) {
      return false
    }
  }

  createIpfsProvider = async () => {
    let baseUrl, dagGetUrl, dagPutUrl
    if (this.ignoreQuasar) {
      baseUrl = 'http://localhost:5001/api/v0'
      dagGetUrl = 'dag/get?arg='
      dagPutUrl = 'dag/put'
    } else {
      const response = await fetch(`${this.quasarEndpoint}/ipfs-provider`)
      const result = await response.json()
      baseUrl = result.baseUrl
      dagGetUrl = result.dagGetUrl
      dagPutUrl = 'dag/put'
    }
    this.ipfs = {
      dag: {
        get: async cid => {
          const response = await fetch(`${baseUrl}/${dagGetUrl}${cid}`)
          return response.json()
        },
        put: async dag => {
          if (this.ignoreQuasar) {
            const data = new FormData()
            data.append('v0', JSON.stringify(dag))
            /*
              Note: you might get CORS errors. Simply enable cors for your dev environment
              https://github.com/ipfs/js-ipfs-http-client#cors
            */
            const response = await fetch(`${baseUrl}/${dagPutUrl}`, {
              method: 'POST',
              body: data,
            })
            const { Cid } = await response.json()
            return Cid['/']
          } else {
            const response = await fetch(`${this.quasarEndpoint}/dag/put`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(dag),
            })

            if (response.status === 201) return response.text()

            throw new Error(
              'There was a problem pinning your data. Please wait a few minutes and try again'
            )
          }
        },
      },
    }
    return this.ipfs
  }
}

export default Quasar

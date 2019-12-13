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
      const response = await fetch(`${this.quasarEndpoint}/storageContracts`, {
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
    this.ipfs = {
      cat: async hash => {
        try {
          const result = await fetch(`${this.quasarEndpoint}/cat?arg=${hash}`)
          return result
        } catch (err) {
          console.error('Error fetching file from IPFS', err)
        }
      },
      add: async file => {
        const formData = new FormData()
        formData.append('entry', file)

        try {
          const response = await fetch(`${this.quasarEndpoint}/add`, {
            method: 'POST',
            body: formData,
          })
          if (response.status === 201) return response.text()

          throw new Error(
            'There was a problem pinning your data. Please wait a few minutes and try again'
          )
        } catch (err) {
          console.error('Error pinning file to IPFS', err)
        }
      },
      dag: {
        get: async cid => {
          const response = await fetch(
            `${this.quasarEndpoint}/dag/get?arg=${cid}`
          )
          return response.json()
        },
        put: async dag => {
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
        },
      },
    }
    return this.ipfs
  }
}

export default Quasar

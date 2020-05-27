import axios from 'axios'
import ipfsClient from 'ipfs-http-client'
import { ipfsDefaultConf } from './environment'

const environments = {
  development: { host: 'localhost', port: '5001', protocol: 'http' },
  production: { host: 'ipfs.autark.xyz', port: '5001', protocol: 'https' },
  staging: { host: 'ipfs.autark.xyz', port: '5001', protocol: 'https' },
}

export const ipfs = ipfsClient(environments[process.env.NODE_ENV])

export const ipfsGet = async hash => {
  const endpoint = `${ipfsDefaultConf.gateway}/${hash}`
  try {
    const { data } = await axios.get(endpoint)
    return data
  } catch (err) {
    console.error('Error getting data from IPFS', err)
  }
}

export const ipfsAdd = async content => {
  const file = Buffer.from(JSON.stringify(content))
  try {
    const result = await ipfs.add(file)
    return result[0].hash
  } catch (err) {
    console.error('Error pinning file to IPFS', err)
  }
}

// compute the hashes individually, then join them together into one string
// this is specific for our bounty smart contract interface
export const computeIpfsString = async issues => {
  const issueHashArray = await Promise.all(
    issues.map(async issue => ipfsAdd(issue))
  )
  return issueHashArray.join('')
}

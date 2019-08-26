import tokens from '@aragon/templates-tokens'
import { soliditySha3 } from '../web3-utils'
import storageAbi from './storage-abi.json'

export function testTokensEnabled(network) {
  return !!tokens[network]
}

export const instantiateStorageContract = (address, params, wrapper) => {
  const contract = new wrapper.web3.eth.Contract(storageAbi, address)
  return {
    registerStorageProvider: async(provider, uri) => {
      const callMethods = storageAbi[0].abi.filter(
        (item) => item.type === 'function' && !item.constant && item.name === 'registerStorageProvider'
      )
      
      console.log('callMethods', callMethods)
      console.log('address', address)
      console.log('provider', provider)
      console.log('uri', uri)
      
      const transactionPath = await wrapper.getExternalTransactionPath(
        address,
        callMethods[0],
        [provider, uri]
      )

      console.log('transactionP', transactionPath)
      wrapper.performTransactionPath(transactionPath)
    }
  }
}

// export default {
//   set: async (wrapper, storageAddr, values) => {},
//   get: (web3, storageAddr, from, paramName) =>
//     getContract(web3, storageAddr)
//       .methods.getRegisteredData(soliditySha3(paramName))
//       .call({ from: from }),
//   subscribe: (web3, storageAddr, paramName, callback) =>
//     getContract(web3, storageAddr).events.Registered(paramName, callback),
// }

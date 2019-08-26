import tokens from '@aragon/templates-tokens'
import { soliditySha3 } from '../web3-utils'
import storageAbi from './storage-abi.json'

export function testTokensEnabled(network) {
  return !!tokens[network]
}

export const instantiateStorageContract = (address, params, wrapper) => {
  console.log('here')
  const contract = new wrapper.web3.eth.Contract(storageAbi, address)
  console.log('contract', contract)
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

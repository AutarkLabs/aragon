import tokens from '@aragon/templates-tokens'
import { soliditySha3 } from '../web3-utils'
import storageAbi from './storage-abi.json'

export function testTokensEnabled(network) {
  return !!tokens[network]
}

export const instantiateStorageContract = (address, wrapper) => {
  const contract = new wrapper.web3.eth.Contract(storageAbi, address)
  const returnContract = {}
  const intentMethods = storageAbi[0].abi.filter(
    item => item.type === 'function' && !item.constant
  )

  intentMethods.forEach(
    method =>
      (returnContract[method.name] = async (...params) => {
        console.log('parms', params)
        console.log('address', address)
        console.log('method', method)
        const transactionPath = await wrapper.getExternalTransactionPath(
          address,
          method,
          params
        )

        console.log('transactionP', transactionPath)
        wrapper.performTransactionPath(transactionPath)
      })
  )

  return returnContract
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

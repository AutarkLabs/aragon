import tokens from '@aragon/templates-tokens'
import { toHex } from '../web3-utils'
import storageAbi from './storage-abi.json'

export function testTokensEnabled(network) {
  return !!tokens[network]
}
const getContract = (web3, storageAddr) => {
  return new web3.eth.Contract(storageAbi, storageAddr)
}

export default {
  set: async (wrapper, storageAddr, values) => {
    let upgradeIntents = []
    if (!values || values.length === 0) {
      return
    }

    // for (const paramKey of Object.keys(values)) {
    //   upgradeIntents.push([
    //     storageAddr,
    //     'registerData',
    //     [soliditySha3(paramKey), values[paramKey]],
    //   ])
    // }
    const intentKeys = Object.keys(values).map(k => toHex(k))
    const intentValues = Object.values(values).map(v => toHex(v))

    upgradeIntents.push([
      storageAddr,
      'changeMultipleSettings',
      [intentKeys, intentValues],
    ])

    const upgradePath = await wrapper.getTransactionPathForIntentBasket(
      upgradeIntents,
      { checkMode: 'single' }
    )

    if (upgradePath.direct) {
      // User has direct access, so we need to send these intents one by one
      for (const transaction of upgradePath.transactions) {
        await wrapper.performTransactionPath([transaction])
      }
    } else {
      // We can use the power of calls scripts to do a single transaction!
      // Or, the user just can't perform this action.
      await wrapper.performTransactionPath(upgradePath.path)
    }
  },
  get: (web3, storageAddr, from, paramName) =>
    getContract(web3, storageAddr)
      .methods.getRegisteredData(toHex(paramName))
      .call({ from: from }),
  subscribe: (web3, storageAddr, paramName, callback) =>
    getContract(web3, storageAddr).events.Registered(paramName, callback),
}

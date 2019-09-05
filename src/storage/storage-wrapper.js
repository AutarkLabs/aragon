import storageAbi from './storage-abi.json'

export const instantiateStorageContract = (address, wrapper) => {
  const contract = {}
  storageAbi.abi
    .filter(item => item.type === 'function' && !item.constant)
    .forEach(
      intentMethod =>
        (contract[intentMethod.name] = async (...params) => {
          const transactionPath = await wrapper.getExternalTransactionPath(
            address,
            intentMethod,
            params
          )
          return wrapper.performTransactionPath(transactionPath)
        })
    )

  storageAbi.abi
    .filter(item => item.type === 'function' && item.constant)
    .forEach(callMethod => {
      const singleMethodContract = new wrapper.web3.eth.Contract(
        [callMethod],
        address
      )
      contract[callMethod.name] = (...params) =>
        singleMethodContract.methods[callMethod.name](...params).call()
    })
  return contract
}

import React, { useCallback, useState } from 'react'
import PropTypes from 'prop-types'
import { Button, DropDown, TextInput, theme } from '@aragon/ui'
import styled from 'styled-components'
import { instantiateStorageContract } from '../../storage/storage-wrapper'

export const ARAGON_ASSOCIATION = 'ARAGON_ASSOCIATION'
export const INFURA = 'INFURA'
export const PINATA = 'PINATA'
export const TEMPORAL_CLOUD = 'TEMPORAL_CLOUD'

const items = [ARAGON_ASSOCIATION, INFURA, PINATA, TEMPORAL_CLOUD]

const ProviderCredentialInputs = ({
  input1,
  input2,
  value1,
  value2,
  setValue1,
  setValue2,
}) => {
  return (
    <InputsContainer>
      <InputContainer css={{ marginRight: '10px' }}>
        <SettingsLabel>{input1}</SettingsLabel>
        <TextInput
          wide
          value={value1}
          onChange={event => setValue1(event.target.value)}
        />
      </InputContainer>
      <InputContainer css={{ marginLeft: '10px' }}>
        <SettingsLabel>{input2}</SettingsLabel>
        <TextInput
          wide
          type="password"
          value={value2}
          onChange={event => setValue2(event.target.value)}
        />
      </InputContainer>
    </InputsContainer>
  )
}

const Storage = ({ apps, wrapper }) => {
  console.log('warpper,', wrapper)
  const [activeProvider, setActiveProvider] = useState(0)
  const [value1, setValue1] = useState('')
  const [value2, setValue2] = useState('')
  const smartContractProviderValue = ARAGON_ASSOCIATION

  return (
    <div>
      <MarginBottom>
        <MarginBottom>
          <SettingsLabel>Provider</SettingsLabel>
          <DropDown
            css={{ width: '300px' }}
            items={items.map(item => {
              if (item === ARAGON_ASSOCIATION) return 'Aragon Association'
              if (item === INFURA) return 'Infura'
              if (item === PINATA) return 'Pinata'
              if (item === TEMPORAL_CLOUD) return 'Temporal Cloud'
            })}
            selected={activeProvider}
            onChange={setActiveProvider}
          />
        </MarginBottom>
        <MarginBottom>
          {activeProvider === 2 && (
            <ProviderCredentialInputs
              input1="Key"
              input2="Secret"
              value1={value1}
              value2={value2}
              setValue1={setValue1}
              setValue2={setValue2}
            />
          )}
          {activeProvider === 3 && (
            <ProviderCredentialInputs
              input1="Username"
              input2="Password"
              value1={value1}
              value2={value2}
              setValue1={setValue1}
              setValue2={setValue2}
            />
          )}
        </MarginBottom>
      </MarginBottom>
      <Button
        disabled={smartContractProviderValue === items[activeProvider]}
        mode="strong"
        onClick={() => {
          const storageApp = apps.find(({ name }) => name === 'Storage')
          const contract = instantiateStorageContract(
            storageApp.proxyAddress,
            wrapper
          )
          contract.registerStorageProvider(
            items[activeProvider],
            'https://infura.io'
          )
        }}
      >
        Save changes
      </Button>
      <Button
        mode="strong"
        onClick={async () => {
          const storageApp = apps.find(({ name }) => name === 'Storage')
          const contract = instantiateStorageContract(
            storageApp.proxyAddress,
            wrapper
          )
          const [provider, uri] = await contract.getStorageProvider()
          console.log(provider, uri)
        }}
      >
        Get smart contract
      </Button>
    </div>
  )
}

const InputsContainer = styled.div`
  display: flex;
`

const InputContainer = styled.div`
  width: 50%;
`

const SettingsLabel = styled.div`
  margin-bottom: 10px;
  color: ${theme.textTertiary};
`

const MarginBottom = styled.div`
  margin-bottom: 20px;
`

export default Storage

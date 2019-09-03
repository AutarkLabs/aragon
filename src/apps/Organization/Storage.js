import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { Button, DropDown, TextInput, theme } from '@aragon/ui'
import styled from 'styled-components'
import { useIpfs } from '../../hooks'
import { AppType, AragonType } from '../../prop-types'
import noResultsSvg from '../../components/GlobalPreferences/CustomLabels/no-results.svg'

export const ARAGON_ASSOCIATION = 'ARAGON_ASSOCIATION'
export const INFURA = 'INFURA'
export const PINATA = 'PINATA'
export const TEMPORAL_CLOUD = 'TEMPORAL_CLOUD'

const items = [ARAGON_ASSOCIATION, INFURA, PINATA, TEMPORAL_CLOUD]
const apiEndpoints = [
  'https://api.pinata.cloud',
  'https://ipfs.infura.io:5001',
  'https://api.pinata.cloud',
  'https://api.ipfs.temporal.cloud',
]

const ProviderCredentialInputs = ({
  providerKeyInput,
  providerSecretInput,
  providerKey,
  providerSecret,
  setProviderKey,
  setProviderSecret,
}) => {
  return (
    <InputsContainer>
      <InputContainer css={{ marginRight: '10px' }}>
        <SettingsLabel>{providerKeyInput}</SettingsLabel>
        <TextInput
          wide
          value={providerKey}
          onChange={event => setProviderKey(event.target.value)}
        />
      </InputContainer>
      <InputContainer css={{ marginLeft: '10px' }}>
        <SettingsLabel>{providerSecretInput}</SettingsLabel>
        <TextInput
          wide
          type="password"
          value={providerSecret}
          onChange={event => setProviderSecret(event.target.value)}
        />
      </InputContainer>
    </InputsContainer>
  )
}

ProviderCredentialInputs.propTypes = {
  providerKeyInput: PropTypes.string.isRequired,
  providerSecretInput: PropTypes.string.isRequired,
  providerKey: PropTypes.string.isRequired,
  providerSecret: PropTypes.string.isRequired,
  setProviderKey: PropTypes.func.isRequired,
  setProviderSecret: PropTypes.func.isRequired,
}

const Storage = ({ apps, wrapper }) => {
  const {
    ipfsProviderName,
    updateIpfsProvider,
    isStorageAppInstalled,
  } = useIpfs()

  const [activeProvider, setActiveProvider] = useState(
    items.indexOf(ipfsProviderName)
  )
  const [providerKey, setProviderKey] = useState('')
  const [providerSecret, setProviderSecret] = useState('')
  return (
    <StorageWrapper>
      {!isStorageAppInstalled ? (
        <NoStorageCard />
      ) : (
        <React.Fragment>
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
                  providerKeyInput="Key"
                  providerSecretInput="Secret"
                  providerKey={providerKey}
                  providerSecret={providerSecret}
                  setProviderKey={setProviderKey}
                  setProviderSecret={setProviderSecret}
                />
              )}
              {activeProvider === 3 && (
                <ProviderCredentialInputs
                  providerKeyInput="Username"
                  providerSecretInput="Password"
                  providerKey={providerKey}
                  providerSecret={providerSecret}
                  setProviderKey={setProviderKey}
                  setProviderSecret={setProviderSecret}
                />
              )}
            </MarginBottom>
          </MarginBottom>
          <Button
            disabled={ipfsProviderName === items[activeProvider]}
            mode="strong"
            onClick={() =>
              updateIpfsProvider(
                items[activeProvider],
                apiEndpoints[activeProvider],
                providerKey,
                providerSecret
              )
            }
          >
            Save changes
          </Button>
        </React.Fragment>
      )}
    </StorageWrapper>
  )
}

Storage.propTypes = {
  apps: PropTypes.arrayOf(AppType),
  wrapper: AragonType,
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
const NoStorageCard = () => (
  <div
    css={`
      margin-top: 56px;
      display: flex;
      flex-direction: column;
      align-items: center;
    `}
  >
    <img
      css={`
        margin: 56px 0;
      `}
      src={noResultsSvg}
      alt="No results"
    />
    <h3
      css={`
        font-size: 28px;
        color: ${theme.content};
        margin-bottom: 14px;
      `}
    >
      No storage app yet.
    </h3>
  </div>
)

const StorageWrapper = styled.div`
  display: flex;
  justify-content: center;
`
export default Storage

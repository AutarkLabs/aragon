import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { Button, DropDown, Field, Text, TextInput, theme } from '@aragon/ui'
import AppLayout from '../../components/AppLayout/AppLayout'
import { InvalidNetworkType, InvalidURI, NoConnection } from '../../errors'
import { defaultEthNode, ipfsDefaultConf, network } from '../../environment'
import {
  getSelectedCurrency,
  setDefaultEthNode,
  setIpfsGateway,
  setSelectedCurrency,
} from '../../local-settings'
import { sanitizeNetworkType } from '../../network-config'
import {
  AppType,
  AragonType,
  DaoAddressType,
  EthereumAddressType,
  HomeSettingsType,
} from '../../prop-types'
import { checkValidEthNode } from '../../web3-utils'
import DaoSettings from './DaoSettings'
import Option from './Option'
import Note from './Note'
import HomeSettings from './HomeSettings'
import {
  storeInCache,
  getFromCache,
  createIpfsProvider,
} from '../../storage/cache'

// Only USD for now
const AVAILABLE_CURRENCIES = ['USD']

// If the currency isn’t available, get the first available instead.
const filterCurrency = currency => {
  currency = currency.toUpperCase()
  return AVAILABLE_CURRENCIES.indexOf(currency) > -1
    ? currency
    : AVAILABLE_CURRENCIES[0]
}

class Settings extends React.Component {
  static propTypes = {
    account: EthereumAddressType,
    apps: PropTypes.arrayOf(AppType).isRequired,
    appsLoading: PropTypes.bool.isRequired,
    daoAddress: DaoAddressType.isRequired,
    onMessage: PropTypes.func.isRequired,
    onOpenApp: PropTypes.func.isRequired,
    walletNetwork: PropTypes.string.isRequired,
    walletWeb3: PropTypes.object.isRequired,
    wrapper: AragonType,
    homeSettings: HomeSettingsType,
  }
  state = {
    currencies: AVAILABLE_CURRENCIES,
    ethNode: defaultEthNode,
    homeAppAlias: 'Home',
    ipfsGateway: ipfsDefaultConf.gateway,
    selectedCurrency: filterCurrency(getSelectedCurrency()),
    selectedHomeApp: 'Home',
    selectedNodeError: null,
  }
  handleSelectedCurrencyChange = (index, currencies) => {
    setSelectedCurrency(currencies[index])
    this.setState({ selectedCurrency: currencies[index] })
  }
  handleDefaultEthNodeChange = event => {
    this.setState({
      ethNode: event.target.value && event.target.value.trim(),
      selectedNodeError: null,
    })
  }
  handleIpfsGatewayChange = event => {
    this.setState({
      ipfsGateway: event.target.value && event.target.value.trim(),
    })
  }
  handleNodeSettingsSave = async () => {
    const { ethNode, ipfsGateway } = this.state

    try {
      await checkValidEthNode(ethNode, network.type)
    } catch (err) {
      this.setState({ selectedNodeError: err })
      return
    }

    setDefaultEthNode(ethNode)
    setIpfsGateway(ipfsGateway)
    // For now, we have to reload the page to propagate the changes
    window.location.reload()
  }
  handleRefreshCache = async () => {
    await this.props.wrapper.cache.clear()
    window.localStorage.clear()
    window.location.reload()
  }

  handleMenuPanelOpen = () => {
    this.props.onMessage({
      data: { from: 'app', name: 'menuPanel', value: true },
    })
  }

  handleSetCache = () => {
    const wrapper = this.props.wrapper
    const objToStore = {
      key: 'provider',
      value: {
        pinata: {
          clientId: 123,
          clientSecret: 456,
        },
      },
    }
    storeInCache(wrapper, objToStore.key, objToStore.value)
      .then(console.log)
      .catch(console.log)
  }

  handleGetCache = () => {
    const wrapper = this.props.wrapper
    const objToStore = {
      key: 'provider',
      value: {
        pinata: {
          clientId: 123,
          clientSecret: 456,
        },
      },
    }
    getFromCache(wrapper, objToStore.key).subscribe({
      next(x) {
        console.log('got value ', x)
      },
    })
  }

  handleAuthProvider = () => {
    const apiKey = 'ADD YOURS'
    const apiSecret = 'CHANGE THIS'
    createIpfsProvider('pinata', apiKey, apiSecret)
  }
  render() {
    const {
      account,
      apps,
      appsLoading,
      daoAddress,
      onOpenApp,
      walletNetwork,
      walletWeb3,
      wrapper,
      homeSettings,
    } = this.props
    const {
      currencies,
      ethNode,
      ipfsGateway,
      selectedCurrency,
      selectedNodeError,
    } = this.state

    return (
      <AppLayout
        title="Settings"
        onMenuOpen={this.handleMenuPanelOpen}
        smallViewPadding={20}
      >
        <Content>
          <DaoSettings
            apps={apps}
            appsLoading={appsLoading}
            account={account}
            daoAddress={daoAddress}
            onOpenApp={onOpenApp}
            walletNetwork={walletNetwork}
            walletWeb3={walletWeb3}
          />
          {currencies.length > 1 && selectedCurrency && (
            <Option
              name="Currency"
              text={`
                This will be the default currency for displaying purposes.
                It will be converted to ETH under the hood.
              `}
            >
              <Field label="Select currency">
                <DropDown
                  active={currencies.indexOf(selectedCurrency)}
                  items={currencies}
                  onChange={this.handleSelectedCurrencyChange}
                />
              </Field>
            </Option>
          )}
          <HomeSettings
            homeSettings={homeSettings}
            apps={apps}
            wrapper={wrapper}
          />
          <Option
            name="Node settings (advanced)"
            text={`
              Change the Ethereum and IPFS nodes this app is connected to.
            `}
          >
            <Field label="Ethereum node">
              <TextInput
                onChange={this.handleDefaultEthNodeChange}
                wide
                value={ethNode}
              />
              {selectedNodeError && (
                <Text color={theme.negative} size="xsmall">
                  {(() => {
                    if (selectedNodeError instanceof InvalidNetworkType) {
                      return `Node must be connected to ${sanitizeNetworkType(
                        network.type
                      )}`
                    }
                    if (selectedNodeError instanceof InvalidURI) {
                      return 'Must provide WebSocket endpoint to node'
                    }
                    if (selectedNodeError instanceof NoConnection) {
                      return 'Could not connect to node'
                    }
                    return 'URI does not seem to be a ETH node'
                  })()}
                </Text>
              )}
            </Field>
            <Field label="IPFS gateway">
              <TextInput
                onChange={this.handleIpfsGatewayChange}
                wide
                value={ipfsGateway}
              />
            </Field>
            <Button mode="secondary" onClick={this.handleNodeSettingsSave}>
              Save settings
            </Button>
          </Option>
          {wrapper && (
            <Option
              name="Troubleshooting"
              text={`
                Press this button to refresh the cache of the application in your
                browser.
              `}
            >
              <div>
                <Button mode="secondary" onClick={this.handleRefreshCache}>
                  Clear application cache
                </Button>
                <Button mode="secondary" onClick={this.handleSetCache}>
                  Set application cache
                </Button>
                <Button mode="secondary" onClick={this.handleGetCache}>
                  Get application cache
                </Button>
              </div>
              <Note>
                This will only delete the data stored in your browser to make
                the app load faster. No data related to the organization itself
                will be altered.
              </Note>
              <Button mode="secondary" onClick={this.handleAuthProvider}>
                Auth with your provider
              </Button>
            </Option>
          )}
        </Content>
      </AppLayout>
    )
  }
}

const Content = styled.div`
  max-width: 600px;
`

export default Settings

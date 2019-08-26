import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import memoize from 'lodash.memoize'
import { AppCenter, Home, Organization, Permissions } from './apps'
import App404 from './components/App404/App404'
import AppIFrame from './components/App/AppIFrame'
import AppLoader from './components/App/AppLoader'
import OrgView from './components/OrgView/OrgView'
import GlobalPreferences from './components/GlobalPreferences/GlobalPreferences'
import SignerPanel from './components/SignerPanel/SignerPanel'
import UpgradeBanner from './components/Upgrade/UpgradeBanner'
import UpgradeOrganizationPanel from './components/Upgrade/UpgradeOrganizationPanel'
import { useIdentity } from './components/IdentityManager/IdentityManager'
import {
  AppType,
  AppsStatusType,
  AragonType,
  DaoAddressType,
  DaoStatusType,
  EthereumAddressType,
  RepoType,
} from './prop-types'
import { getAppPath, getPreferencesSearch } from './routing'
import { APPS_STATUS_LOADING, DAO_STATUS_LOADING } from './symbols'
import { addressesEqual } from './web3-utils'

class Wrapper extends React.PureComponent {
  static propTypes = {
    account: EthereumAddressType,
    apps: PropTypes.arrayOf(AppType).isRequired,
    appsStatus: AppsStatusType.isRequired,
    canUpgradeOrg: PropTypes.bool,
    connected: PropTypes.bool,
    daoAddress: DaoAddressType.isRequired,
    daoStatus: DaoStatusType.isRequired,
    historyBack: PropTypes.func.isRequired,
    historyPush: PropTypes.func.isRequired,
    identityEvents$: PropTypes.object.isRequired,
    locator: PropTypes.object.isRequired,
    onRequestAppsReload: PropTypes.func.isRequired,
    onRequestEnable: PropTypes.func.isRequired,
    permissionsLoading: PropTypes.bool.isRequired,
    repos: PropTypes.arrayOf(RepoType).isRequired,
    transactionBag: PropTypes.object,
    signatureBag: PropTypes.object,
    visible: PropTypes.bool.isRequired,
    walletNetwork: PropTypes.string,
    walletProviderId: PropTypes.string,
    walletWeb3: PropTypes.object,
    web3: PropTypes.object,
    wrapper: AragonType,
  }

  static defaultProps = {
    account: '',
    connected: false,
    transactionBag: null,
    signatureBag: null,
    walletNetwork: '',
    walletProviderId: '',
    walletWeb3: null,
  }

  state = {
    appLoading: false,
    orgUpgradePanelOpened: false,
  }

  identitySubscription = null

  componentDidMount() {
    this.startIdentitySubscription()
  }

  componentWillUnmount() {
    this.identitySubscription.unsubscribe()
  }

  componentDidUpdate(prevProps) {
    this.updateIdentityEvents(prevProps)
  }

  updateIdentityEvents(prevProps) {
    const { identityEvents$ } = this.props
    if (identityEvents$ !== prevProps.identityEvents$) {
      this.stopIdentitySubscription()
      this.startIdentitySubscription()
    }
  }

  startIdentitySubscription() {
    const { identityEvents$ } = this.props
    this.identitySubscription = identityEvents$.subscribe(event => {
      if (this.appIFrame) {
        this.appIFrame.reloadIframe()
      }
    })
  }

  stopIdentitySubscription() {
    if (this.identitySubscription) {
      this.identitySubscription.unsubscribe()
    }
  }

  openApp = (instanceId, { params, localPath } = {}) => {
    if (this.props.autoClosingPanel) {
      // this.handleMenuPanelClose()
    }

    const { historyPush, locator } = this.props
    historyPush(getAppPath({ dao: locator.dao, instanceId, params, localPath }))
  }

  closePreferences = () => {
    const { historyPush, locator } = this.props
    historyPush(getAppPath(locator))
  }

  openPreferences = (screen, data) => {
    const { historyPush, locator } = this.props
    historyPush(
      getAppPath({ ...locator, search: getPreferencesSearch(screen, data) })
    )
  }

  handleAppIFrameRef = appIFrame => {
    this.appIFrame = appIFrame
  }

  handleAppIFrameLoadingSuccess = async ({ iframeElement }) => {
    const {
      apps,
      wrapper,
      locator: { instanceId },
    } = this.props
    if (!wrapper) {
      console.error(
        `Attempted to connect app (${instanceId}) before aragonAPI was ready`
      )
      return
    }
    if (!apps.find(app => addressesEqual(app.proxyAddress, instanceId))) {
      console.error(
        `The requested app (${instanceId}) could not be found in the installed apps`
      )
      return
    }

    await wrapper.connectAppIFrame(iframeElement, instanceId)

    this.appIFrame.sendMessage({
      from: 'wrapper',
      name: 'ready',
      value: true,
    })
    this.setState({ appLoading: false })
  }
  handleAppIFrameLoadingStart = event => {
    this.setState({ appLoading: true })
  }
  handleAppIFrameLoadingCancel = event => {
    this.setState({ appLoading: false })
  }
  handleAppIFrameLoadingError = event => {
    this.setState({ appLoading: false })
  }

  // params need to be a string
  handleParamsRequest = params => {
    this.openApp(this.props.locator.instanceId, { params })
  }

  // Update the local path of the current instance
  handlePathRequest = localPath => {
    this.openApp(this.props.locator.instanceId, { localPath })
  }

  getAppInstancesGroups = memoize(apps =>
    apps.reduce((groups, app) => {
      const group = groups.find(({ appId }) => appId === app.appId)

      const {
        // This is not technically fully true, but let's assume that only these
        // aspects be different between multiple instances of the same app
        codeAddress: instanceCodeAddress,
        identifier: instanceIdentifier,
        proxyAddress: instanceProxyAddress,
        ...sharedAppInfo
      } = app

      const instance = {
        codeAddress: instanceCodeAddress,
        identifier: instanceIdentifier,
        instanceId: instanceProxyAddress,
        proxyAddress: instanceProxyAddress,
      }

      // Append the instance to the existing app group
      if (group) {
        group.instances.push(instance)
        return groups
      }

      return groups.concat([
        {
          app: sharedAppInfo,
          appId: app.appId,
          name: app.name,
          instances: [instance],
          hasWebApp: app.hasWebApp,
          repoName: app.appName,
        },
      ])
    }, [])
  )

  showOrgUpgradePanel = () => {
    this.setState({ orgUpgradePanelOpened: true })
  }
  hideOrgUpgradePanel = () => {
    this.setState({ orgUpgradePanelOpened: false })
  }

  render() {
    const {
      account,
      apps,
      appsStatus,
      canUpgradeOrg,
      connected,
      daoAddress,
      daoStatus,
      locator,
      onRequestAppsReload,
      onRequestEnable,
      repos,
      transactionBag,
      signatureBag,
      visible,
      walletNetwork,
      walletProviderId,
      walletWeb3,
      web3,
      wrapper,
    } = this.props

    const { appLoading, orgUpgradePanelOpened } = this.state

    const currentApp = apps.find(app =>
      addressesEqual(app.proxyAddress, locator.instanceId)
    )

    return (
      <div
        css={`
          display: ${visible ? 'flex' : 'none'};
          flex-direction: column;
          position: relative;
          z-index: 0;
          height: 100vh;
          min-width: 360px;
        `}
      >
        <BannerWrapper>
          <UpgradeBanner
            visible={canUpgradeOrg}
            onUpgrade={this.showOrgUpgradePanel}
          />
        </BannerWrapper>

        <OrgView
          account={account}
          activeInstanceId={locator.instanceId}
          appInstanceGroups={this.getAppInstancesGroups(apps)}
          apps={apps}
          appsStatus={appsStatus}
          connected={connected}
          daoAddress={daoAddress}
          daoStatus={daoStatus}
          onOpenApp={this.openApp}
          onOpenPreferences={this.openPreferences}
          onRequestAppsReload={onRequestAppsReload}
          onRequestEnable={onRequestEnable}
        >
          <AppLoader
            appLoading={appLoading}
            appsLoading={!wrapper || appsStatus === APPS_STATUS_LOADING}
            currentAppName={currentApp ? currentApp.name : ''}
            daoLoading={daoStatus === DAO_STATUS_LOADING}
            instanceId={locator.instanceId}
          >
            {this.renderApp(locator.instanceId, {
              params: locator.params,
              localPath: locator.localPath,
            })}
          </AppLoader>

          <SignerPanel
            account={account}
            apps={apps}
            dao={locator.dao}
            onRequestEnable={onRequestEnable}
            transactionBag={transactionBag}
            signatureBag={signatureBag}
            walletNetwork={walletNetwork}
            walletProviderId={walletProviderId}
            walletWeb3={walletWeb3}
            web3={web3}
          />

          {canUpgradeOrg && (
            <UpgradeOrganizationPanel
              daoAddress={daoAddress}
              opened={orgUpgradePanelOpened}
              onClose={this.hideOrgUpgradePanel}
              repos={repos}
              wrapper={wrapper}
            />
          )}
        </OrgView>

        <GlobalPreferences
          locator={locator}
          wrapper={wrapper}
          onScreenChange={this.openPreferences}
          onClose={this.closePreferences}
        />
      </div>
    )
  }
  renderApp(instanceId, { params, localPath }) {
    const {
      account,
      apps,
      appsStatus,
      canUpgradeOrg,
      connected,
      daoAddress,
      locator,
      permissionsLoading,
      repos,
      walletNetwork,
      walletProviderId,
      walletWeb3,
      wrapper,
    } = this.props

    const appsLoading = appsStatus === APPS_STATUS_LOADING
    const reposLoading = appsLoading || Boolean(apps.length && !repos.length)

    if (instanceId === 'home') {
      return (
        <Home
          apps={apps}
          connected={connected}
          dao={locator.dao}
          onMessage={this.handleAppMessage}
          onOpenApp={this.openApp}
        />
      )
    }

    if (instanceId === 'permissions') {
      return (
        <Permissions
          apps={apps}
          appsLoading={appsLoading}
          permissionsLoading={permissionsLoading}
          localPath={localPath}
          onMessage={this.handleAppMessage}
          onPathRequest={this.handlePathRequest}
          wrapper={wrapper}
        />
      )
    }

    if (instanceId === 'apps') {
      return (
        <AppCenter
          appInstanceGroups={this.getAppInstancesGroups(apps)}
          daoAddress={daoAddress}
          params={params}
          repos={repos}
          canUpgradeOrg={canUpgradeOrg}
          reposLoading={reposLoading}
          onMessage={this.handleAppMessage}
          onUpgradeAll={this.showOrgUpgradePanel}
          onParamsRequest={this.handleParamsRequest}
          wrapper={wrapper}
        />
      )
    }

    if (instanceId === 'organization') {
      return (
        <Organization
          account={account}
          apps={apps}
          appsLoading={appsLoading}
          daoAddress={daoAddress}
          onMessage={this.handleAppMessage}
          onOpenApp={this.openApp}
          walletNetwork={walletNetwork}
          walletWeb3={walletWeb3}
          walletProviderId={walletProviderId}
          wrapper={wrapper}
        />
      )
    }

    // AppLoader will display a loading screen in that case
    if (!wrapper || appsLoading) {
      return null
    }

    const app = apps.find(app => addressesEqual(app.proxyAddress, instanceId))

    return app ? (
      <AppIFrame
        ref={this.handleAppIFrameRef}
        app={app}
        onLoadingCancel={this.handleAppIFrameLoadingCancel}
        onLoadingError={this.handleAppIFrameLoadingError}
        onLoadingStart={this.handleAppIFrameLoadingStart}
        onLoadingSuccess={this.handleAppIFrameLoadingSuccess}
        onMessage={this.handleAppMessage}
      />
    ) : (
      <App404 onNavigateBack={this.props.historyBack} />
    )
  }
}

const BannerWrapper = styled.div`
  position: relative;
  z-index: 1;
  flex-shrink: 0;
`

export default props => {
  const { identityEvents$ } = useIdentity()
  return <Wrapper {...props} identityEvents$={identityEvents$} />
}

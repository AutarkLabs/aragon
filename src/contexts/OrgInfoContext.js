import React, { createContext, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { useClientTheme } from '../client-theme'
import { setClientOrgInfo, getClientOrgInfo } from '../local-settings'
import { useOrganizationDataStore } from '../hooks'

const ORG_SETTINGS_BASIC_INFO = 'ORG_SETTINGS_BASIC_INFO'
const ORG_SETTINGS_BRAND = 'ORG_SETTINGS_BRAND'
const CLIENT_ORG_INFO = getClientOrgInfo()

export const OrgInfoContext = createContext({})

export const OrgInfoProvider = ({children}) => {
  const {
    ipfsEndpoints,
    getDagFromOrgDataStore,
    ipfsProviderConnectionSuccess,
  } = useOrganizationDataStore()
  const { appearance, updateClientTheme } = useClientTheme()
  const [orgInfo, setOrgInfo] = useState(CLIENT_ORG_INFO)
  const [fetchedData, setFetchedData] = useState(false)

  const fetchOrgInfo = async () => {
    const [basicInfo, {style_cid, logo_cid}] = await Promise.all([
      getDagFromOrgDataStore(ORG_SETTINGS_BASIC_INFO),
      getDagFromOrgDataStore(ORG_SETTINGS_BRAND)
    ])
    const data = basicInfo || {}
    if (style_cid) {
      const style = await ipfsEndpoints.dag.get(style_cid)
      if (style) {
        data.background = style.background
        data.theme = style.theme
      }
    }
    const clientData = {...data} //images stored in local storage will differ than stored in state, thus two objects
    if (logo_cid) {
      const logo = await ipfsEndpoints.cat(logo_cid)
      if (logo && logo.ok) {
        const arrayBuffer = await logo.arrayBuffer()
        data.image = URL.createObjectURL(new Blob([arrayBuffer], { type: "image/jpeg" } ))
        clientData.image = JSON.stringify(Array.from(new Uint32Array(arrayBuffer)))
      }
    }

    setOrgInfo(data)
    setClientOrgInfo(clientData)
    setFetchedData(true)

    updateClientTheme(
      appearance,
      {
        ...data.theme,
        _name: appearance,
        _appearance: appearance,
      }
    )
  }

  useEffect(() => {
    if (!fetchedData && ipfsProviderConnectionSuccess) {
      fetchOrgInfo()
    }
  }, [ipfsProviderConnectionSuccess])

  return (
    <OrgInfoContext.Provider value={{ orgInfo, fetchOrgInfo }}>
      {children}
    </OrgInfoContext.Provider>
  )
}

OrgInfoProvider.propTypes = {
  children: PropTypes.node.isRequired,
}

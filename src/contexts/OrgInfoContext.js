import React, { createContext, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { useClientTheme } from '../client-theme'
import { useOrganizationDataStore } from '../hooks'

const ORG_SETTINGS_BASIC_INFO = 'ORG_SETTINGS_BASIC_INFO'
const ORG_SETTINGS_BRAND = 'ORG_SETTINGS_BRAND'

export const OrgInfoContext = createContext({})

export const OrgInfoProvider = ({children}) => {
  const {
    ipfsEndpoints,
    getDagFromOrgDataStore,
    ipfsProviderConnectionSuccess,
  } = useOrganizationDataStore()
  const { appearance, updateClientTheme } = useClientTheme()
  const [orgInfo, setOrgInfo] = useState()
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
    if (logo_cid) {
      const logo = await ipfsEndpoints.cat(logo_cid)
      if (logo && logo.ok) {
        const arrayBuffer = await logo.arrayBuffer()
        data.image = URL.createObjectURL(new Blob([arrayBuffer], { type: "image/jpeg" } ))
      }
    }
    setOrgInfo(data)
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

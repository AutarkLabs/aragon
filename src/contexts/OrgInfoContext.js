import React, { createContext, useCallback, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { useClientTheme } from '../client-theme'
import { setClientOrgInfo, getClientOrgInfo } from '../local-settings'
import { useOrganizationDataStore } from '../hooks'

const ORG_SETTINGS_BASIC_INFO = 'ORG_SETTINGS_BASIC_INFO'
const ORG_SETTINGS_BRAND = 'ORG_SETTINGS_BRAND'
const CLIENT_ORG_INFO = getClientOrgInfo()

export const OrgInfoContext = createContext({})

export const OrgInfoProvider = ({
  children,
  dao,
  fetchedData,
  //orgInfo,
  setFetchedData,
  //setOrgInfo,
  wrapper,
}) => {
  const {
    ipfsEndpoints,
    getDagFromOrgDataStore,
    ipfsProviderConnectionSuccess,
  } = useOrganizationDataStore()
  const { appearance, updateClientTheme } = useClientTheme()
  const [orgInfo, setOrgInfo] = useState(CLIENT_ORG_INFO)
  //const [fetchedData, setFetchedData] = useState(false)

  const getThisOrg = useCallback(() => {
    if (!dao || !orgInfo) return null
    return orgInfo[dao]
  }, [dao])

  const getOrg = useCallback((dao) => {
    if (!dao || !orgInfo) return null
    return orgInfo[dao]
  })

  const fetchOrgInfo = useCallback(async () => {
    const [
      basicInfo,
      { style_cid: styleCid, logo_cid: logoCid },
    ] = await Promise.all([
      getDagFromOrgDataStore(ORG_SETTINGS_BASIC_INFO),
      getDagFromOrgDataStore(ORG_SETTINGS_BRAND),
    ])
    const data = basicInfo || {}
    if (styleCid) {
      const style = await ipfsEndpoints.dag.get(styleCid)
      if (style) {
        data.background = style.background
        data.theme = style.theme
      }
    }
    const clientData = { ...data } // images stored in local storage will differ than stored in state, thus two objects
    if (logoCid) {
      const logo = await ipfsEndpoints.cat(logoCid)
      if (logo && logo.ok) {
        const arrayBuffer = await logo.arrayBuffer()
        data.image = URL.createObjectURL(
          new Blob([arrayBuffer], { type: 'image/jpeg' })
        )
        clientData.image = JSON.stringify(
          Array.from(new Uint32Array(arrayBuffer))
        )
      }
    }
    const newOrgInfo = {...orgInfo}
    const newClientOrgInfo = {...CLIENT_ORG_INFO}
    newOrgInfo[dao] = data
    newClientOrgInfo[dao] = clientData
    setOrgInfo(newOrgInfo)
    setClientOrgInfo(newClientOrgInfo)
    setFetchedData(true)

    updateClientTheme(appearance, {
      ...data.theme,
      _name: appearance,
      _appearance: appearance,
    })
  }, [appearance, dao, getDagFromOrgDataStore, ipfsEndpoints, updateClientTheme])

  useEffect(() => {
    //setOrgInfo(null)
    if (!fetchedData && ipfsProviderConnectionSuccess && wrapper) {
      fetchOrgInfo()
    }
  }, [dao, ipfsProviderConnectionSuccess, wrapper])

  useEffect(() => {
    if(dao && orgInfo) {
      const data = orgInfo[dao]
      if(data) {
        updateClientTheme(appearance, {
          ...data.theme,
          _name: appearance,
          _appearance: appearance,
        })
      }
    }
  }, [dao, orgInfo])

  return (
    <OrgInfoContext.Provider value={{ getOrg, getThisOrg }}>
      {children}
    </OrgInfoContext.Provider>
  )
}

OrgInfoProvider.propTypes = {
  children: PropTypes.node.isRequired,
}

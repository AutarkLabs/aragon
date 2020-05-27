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
  setFetchedData,
  wrapper,
}) => {
  const {
    ipfsEndpoints,
    getDagFromOrgDataStore,
    ipfsProviderConnectionSuccess,
  } = useOrganizationDataStore()
  const { appearance, updateClientTheme } = useClientTheme()
  const [orgInfo, setOrgInfo] = useState(CLIENT_ORG_INFO)

  const getThisOrg = useCallback(() => {
    if (!dao || !orgInfo) return null
    return orgInfo[dao]
  }, [dao, orgInfo])

  const getOrg = useCallback(
    dao => {
      if (!dao || !orgInfo) return null
      return orgInfo[dao]
    },
    [orgInfo]
  )

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
        data.imageType = style.imageType
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
          new Blob([arrayBuffer], { type: data.imageType })
        )
        clientData.image = btoa(
          String.fromCharCode(...new Uint8Array(arrayBuffer))
        )
      }
    }

    const newOrgInfo = { ...orgInfo }
    const newClientOrgInfo = { ...CLIENT_ORG_INFO }
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
  }, [
    appearance,
    dao,
    getDagFromOrgDataStore,
    ipfsEndpoints,
    orgInfo,
    setFetchedData,
    updateClientTheme,
  ])

  useEffect(() => {
    // setOrgInfo(null)
    if (!fetchedData && ipfsProviderConnectionSuccess && wrapper) {
      fetchOrgInfo()
    }
  }, [dao, fetchOrgInfo, fetchedData, ipfsProviderConnectionSuccess, wrapper])

  useEffect(() => {
    if (dao && orgInfo) {
      const data = orgInfo[dao]
      if (data) {
        updateClientTheme(appearance, {
          ...data.theme,
          _name: appearance,
          _appearance: appearance,
        })
      }
    }
  }, [appearance, dao, orgInfo, updateClientTheme])

  return (
    <OrgInfoContext.Provider value={{ getOrg, getThisOrg }}>
      {children}
    </OrgInfoContext.Provider>
  )
}

OrgInfoProvider.propTypes = {
  children: PropTypes.node.isRequired,
  dao: PropTypes.object.isRequired,
  fetchedData: PropTypes.object.isRequired,
  setFetchedData: PropTypes.func.isRequired,
  wrapper: PropTypes.func.isRequired,
}

import React, { useState, useEffect } from 'react'
import { useOrganizationDataStore } from './hooks'

const ORG_SETTINGS_BASIC_INFO = 'ORG_SETTINGS_BASIC_INFO'
const ORG_SETTINGS_LOGO = 'ORG_SETTINGS_LOGO'

export const getOrgData = () => {
  const {
    getDagFromOrgDataStore,
    getFileFromOrgDataStore,
    ipfsProviderConnectionSuccess,
  } = useOrganizationDataStore()
  const [info, setInfo] = useState()
  const [fetchedData, setFetchedData] = useState(false)

  useEffect(() => {
    const fetchOrgInfo = async () => {
      const dag = await getDagFromOrgDataStore(ORG_SETTINGS_BASIC_INFO)
      const data = dag ? dag : {}
      const file = await getFileFromOrgDataStore(ORG_SETTINGS_LOGO)
      console.log(file)
      if (file) {
        const arrayBuffer = await file.arrayBuffer()
        data.image = URL.createObjectURL(new Blob([arrayBuffer], { type: "image/jpeg" } ))
      }
      console.log(data)
      setInfo(data)
      setFetchedData(true)
    }

    if (!fetchedData && ipfsProviderConnectionSuccess) {
      fetchOrgInfo()
    }
  }, [fetchedData, getDagFromOrgDataStore, ipfsProviderConnectionSuccess])

  return info
}

import React, { useEffect, useState } from 'react'
import { Box, Button, GU, TextInput } from '@aragon/ui'
import Label from './Label'
import { useOrganizationDataStore } from '../../hooks'

const ORG_SETTINGS_BASIC_INFO = 'ORG_SETTINGS_BASIC_INFO'

const BasicInfo = () => {
  const {
    orgInfo,
    setDagInOrgDataStore,
    getDagFromOrgDataStore,
    ipfsProviderConnectionSuccess,
  } = useOrganizationDataStore()
  const [basicInfo, setBasicInfo] = useState({
    name: '',
    website: '',
    description: '',
  })

  useEffect(() => {
    if (orgInfo) {
      setBasicInfo({
        name: orgInfo.name,
        website: orgInfo.website,
        description: orgInfo.description,
      })
    }
  }, [orgInfo])

  const changeBasicInfo = ({ target: { name, value } }) => {
    const newBasicInfo = { ...basicInfo }
    newBasicInfo[name] = value
    setBasicInfo(newBasicInfo)
  }

  const saveBasicInfo = () => {
    setDagInOrgDataStore(ORG_SETTINGS_BASIC_INFO, basicInfo)
  }

  return (
    <Box padding={3 * GU} heading="Basic">
      <div css="display: flex; width: 100%; margin-bottom: 12px">
        <div css="width: 50%; padding-right: 12px">
          <Label text="Name">
            <TextInput
              name="name"
              value={basicInfo.name}
              onChange={changeBasicInfo}
              wide
            />
          </Label>
        </div>

        <div css="width: 50%; padding-left: 12px">
          <Label text="Website">
            <TextInput
              name="website"
              value={basicInfo.website}
              onChange={changeBasicInfo}
              wide
            />
          </Label>
        </div>
      </div>

      <div css="width: 100%; margin-bottom: 24px">
        <Label text="Description">
          <TextInput.Multiline
            name="description"
            value={basicInfo.description}
            onChange={changeBasicInfo}
            wide
          />
        </Label>
      </div>

      <Button mode="strong" onClick={saveBasicInfo}>
        Save changes
      </Button>
    </Box>
  )
}

export default BasicInfo

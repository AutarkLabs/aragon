import React, { useCallback, useEffect, useState } from 'react'
import Dropzone from 'react-dropzone'
import { Box, Button, GU, Info, useTheme } from '@aragon/ui'
import organizationLogoPlaceholder from '../../assets/organization-logo-placeholder.png'
import Label from './Label'
import { useOrganizationDataStore } from '../../hooks'

const ORG_SETTINGS_LOGO = 'ORG_SETTINGS_LOGO'

const Brand = () => {
  const theme = useTheme()
  const [image, setImage] = useState()
  const [fetchedData, setFetchedData] = useState(false)
  const {
    setFileInOrgDataStore,
    getFileFromOrgDataStore,
    ipfsProviderConnectionSuccess,
  } = useOrganizationDataStore()

  useEffect(() => {
    const fetchOrgSettingsLogo = async () => {
      const result = await getFileFromOrgDataStore(ORG_SETTINGS_LOGO)
      if (result) {
        const arrayBuffer = await result.arrayBuffer()
        setImage(URL.createObjectURL(new Blob([arrayBuffer])))
      }
      setFetchedData(true)
    }

    if (!fetchedData && ipfsProviderConnectionSuccess) {
      fetchOrgSettingsLogo()
    }
  }, [fetchedData, getFileFromOrgDataStore, ipfsProviderConnectionSuccess])

  const onDrop = useCallback(
    async acceptedFiles => {
      const file = acceptedFiles[0]
      setImage(URL.createObjectURL(file))
      await setFileInOrgDataStore(ORG_SETTINGS_LOGO, file)
    },
    [setFileInOrgDataStore]
  )

  return (
    <Box padding={3 * GU} heading="Brand">
      <div css="display: flex; flex-direction: column; width: 50%; padding-right: 12px">
        <Label text="Logo" />
        <div css="margin-bottom: 20px; width: 217px;">
          <Dropzone onDrop={onDrop}>
            {({ getRootProps, getInputProps, isDragActive }) => (
              <div {...getRootProps()} css="outline: none">
                <input {...getInputProps()} />
                <div
                  css={`
                    background: ${theme.surfaceUnder};
                    width: 217px;
                    height: 217px;
                    padding: 30px;
                    margin-bottom: 10px;
                    border: ${isDragActive
                      ? '1px dashed green'
                      : '1px solid white'};
                  `}
                >
                  <img
                    css={`
                      width: 157px;
                      height: 157px;
                      border: 0;
                      border-radius: 50%;
                    `}
                    src={image || organizationLogoPlaceholder}
                    alt=""
                  />
                </div>
                <Button
                  mode="outline"
                  css="margin-right: 10px; font-weight: bold"
                >
                  Upload new
                </Button>
                <Info css="margin: 20px 0">Please keep 1:1 ratio</Info>
              </div>
            )}
          </Dropzone>
        </div>
      </div>
    </Box>
  )
}

export default Brand

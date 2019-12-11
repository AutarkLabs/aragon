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
    setData,
    getData,
    ipfsProviderConnectionSuccess,
  } = useOrganizationDataStore()

  useEffect(() => {
    const fetchOrgSettingsLogo = async () => {
      const data = await getData(ORG_SETTINGS_LOGO)
      console.log(data)
      const file = new File([data], `${ORG_SETTINGS_LOGO}.json`, {
        type: 'text/json;charset=utf-8',
      })
      console.log(file)
      if (data) setImage(URL.createObjectURL(file))
      setFetchedData(true)
    }

    if (!fetchedData && ipfsProviderConnectionSuccess) {
      fetchOrgSettingsLogo()
    }
  }, [fetchedData, getData, ipfsProviderConnectionSuccess])

  const onDrop = useCallback(
    async acceptedFiles => {
      const file = acceptedFiles[0]
      // create a preview of the image
      setImage(URL.createObjectURL(file))

      const reader = new FileReader()

      reader.onabort = () => console.log('file reading was aborted')
      reader.onerror = () => console.log('file reading has failed')
      reader.onload = async () => {
        // Do whatever you want with the file contents
        const arrayBuffer = reader.result
        const file = new File([arrayBuffer], `${ORG_SETTINGS_LOGO}.json`, {
          type: 'text/json;charset=utf-8',
        })
        setImage(URL.createObjectURL(file))
        // await setData(ORG_SETTINGS_LOGO, arrayBuffer)
      }
      reader.readAsArrayBuffer(file)
    },
    [setData]
  )

  return (
    <Box padding={3 * GU} heading="Brand">
      <div css="display: flex; flex-direction: column; width: 50%; padding-right: 12px">
        <Label text="Logo" />
        <div css="margin-bottom: 20px">
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

import React, { useCallback, useEffect, useState } from 'react'
import Dropzone from 'react-dropzone'
import { Box, Button, DropDown, GU, IconUpload, Info, Modal, Switch, TextInput, textStyle, useTheme } from '@aragon/ui'
import organizationLogoPlaceholder from '../../assets/organization-logo-placeholder.png'
import Label from './Label'
import { useOrganizationDataStore } from '../../hooks'

const ORG_SETTINGS_LOGO = 'ORG_SETTINGS_LOGO'

const Brand = () => {
  const theme = useTheme()
  const [image, setImage] = useState()
  const [background, setBackground] = useState(true)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [accentStyle, setAccentStyle] = useState(0)
  const [fetchedData, setFetchedData] = useState(false)
  const [accentColor, setAccentColor] = useState('')
  const [accentColor2, setAccentColor2] = useState('')
  const changeAccentColor = e => setAccentColor(e.target.value)
  const changeAccentColor2 = e => setAccentColor2(e.target.value)
  const saveColors = () => {
    console.log('save accent color:', accentColor)
  }
  const colorRX = /^#(([a-f0-9]{3}){1,2})$/i
  const colorError = accentColor && !colorRX.test(accentColor)
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

  const openPreview = () => setPreviewOpen(true)
  const closePreview = () => setPreviewOpen(false)

  return (
    <Box padding={3 * GU} heading="Brand">
      <div css={`display: flex; width: 100%; margin-bottom: ${2 * GU}px`}>
        <div css={`display: flex; flex-direction: column; width: 50%; padding-right: ${2 * GU}px`}>
          <Label text="Logo" />
          <div css={`width: 217px; margin: ${2 * GU}px 0`}>
            <Dropzone onDrop={onDrop}>
              {({ getRootProps, getInputProps, isDragActive }) => (

                <div {...getRootProps()} css="outline: none">
                  <input {...getInputProps()} />
                  {image ? (
                    <div
                      css={`
                        background: ${theme.surfaceUnder};
                        width: 217px;
                        height: 217px;
                        padding: 30px;selectedButtonStyle, setButtonStyle
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
                  ) : (
                    <Button
                      label='Upload new logo'
                      icon={<IconUpload />}
                    />
                  )}
                </div>
              )}
            </Dropzone>
          </div>
          <Info css="width: 100%">Please keep 1:1 ratio</Info>
        </div>
        <div css={`display: flex; flex-direction: column; width: 50%; padding-left: ${2 * GU}px`}>
          <Label text="Background image" />
          <div css={`display: flex; width: 100%; justify-content: space-between; margin: ${3 * GU}px 0`}>
            <span>Include Aragon eagle in the background</span>
            <Switch checked={background} onChange={setBackground} />
          </div>
          <Label text="Accent color hex" />
          <div>
            <DropDown
              css={`min-width: 140px; margin: ${2 * GU}px 0`}
              items={['Solid', 'Gradient']}
              selected={accentStyle}
              onChange={setAccentStyle}
            />
            <div>
              <TextInput
                css={`
                  border: 1px solid ${colorError ? 'red' : '#DDE4E9'};
                  width: 120px;
                  margin-right: ${2 * GU}px;
                `}
                value={accentColor}
                placeholder={accentStyle == 1 ? 'First hex' : ''}
                onChange={changeAccentColor}
              />
              {accentStyle == 1 && (
                <TextInput
                  css={`
                    border: 1px solid ${colorError ? 'red' : '#DDE4E9'};
                    width: 120px;
                    margin-right: ${2 * GU}px;
                  `}
                  value={accentColor2}
                  placeholder='Second hex'
                  onChange={changeAccentColor2}
                />
              )}
              <Button
                label='Preview'
                onClick={openPreview}
              />
            </div>
            {colorError && (
              <span css="margin-top: 3px" color="#F22" size="xsmall">
                Please use #123 or #123456 format
              </span>
            )}
          </div>
        </div>
      </div>
      <Button
        mode='strong'
        label='Save changes'
        css={`margin-right: ${2 * GU}px`}
      />
      <Button
        label='Reset brand'
      />
      <Modal visible={previewOpen} onClose={closePreview}>
        <h2 css={`${textStyle('title2')}; margin-bottom: ${4 * GU}px`}>Accent preview</h2>
        <p css={`margin-bottom: ${2 * GU}px`}>Here's how your new accent styling would like on a button.</p>
        <Button
          mode='strong'
          label='Hello world'
          css={accentColor &&`
            background: linear-gradient( 190deg, ${accentColor} -100%, ${accentColor2 ? accentColor2 : accentColor} 80% ) !important;
          `}
        />
        <div css={`margin-top: ${2 * GU}px; text-align: right`}>
          <Button
            label='Go back'
            onClick={closePreview}
          />
        </div>
      </Modal>
    </Box>
  )
}

export default Brand

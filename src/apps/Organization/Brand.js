import React, { useCallback, useEffect, useState } from 'react'
import Dropzone from 'react-dropzone'
import {
  Box,
  Button,
  DropDown,
  GU,
  IconUpload,
  Info,
  Modal,
  Switch,
  TextInput,
  textStyle,
  useTheme,
} from '@aragon/ui'
import organizationLogoPlaceholder from '../../assets/organization-logo-placeholder.png'
import Label from './Label'
import { useOrganizationDataStore, useOrgInfo } from '../../hooks'

const ORG_SETTINGS_BRAND = 'ORG_SETTINGS_BRAND'

const Brand = () => {
  const theme = useTheme()
  const [image, setImage] = useState()
  const [background, setBackground] = useState(true)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [accentStyle, setAccentStyle] = useState(0)
  const [accentStart, setAccentStart] = useState('')
  const [accentEnd, setAccentEnd] = useState('')
  const changeAccentStart = e => setAccentStart(e.target.value)
  const changeAccentEnd = e => setAccentEnd(e.target.value)

  const colorRX = /^#(([a-f0-9]{3}){1,2})$/i
  const colorError = accentStart && !colorRX.test(accentStart)
  const {
    ipfsEndpoints,
    setDagInOrgDataStore,
    isStorageAppInstalled,
  } = useOrganizationDataStore()
  const { orgInfo } = useOrgInfo()

  useEffect(() => {
    const setBrand = async () => {
      setBackground(orgInfo.background)
      setAccentStart(orgInfo.theme.accentStart)
      if (orgInfo.theme.accentEnd) {
        setAccentStyle(1)
        setAccentEnd(orgInfo.theme.accentEnd)
      }
      const imageBlob = await fetch(orgInfo.image).then(r => r.blob())
      setImage(imageBlob)
    }

    if (orgInfo) setBrand()
  }, [orgInfo])

  const onDrop = useCallback(async acceptedFiles => {
    const file = acceptedFiles[0]
    setImage(file)
  }, [])

  const saveBrand = async () => {
    if (!isStorageAppInstalled) {
      throw new Error('No storage app installed')
    }
    const style = {
      background: background,
      theme: {
        accent: (accentStyle && accentEnd) || accentStart,
        accentStart: accentStart,
        accentEnd: (accentStyle && accentEnd) || accentStart,
        selected: (accentStyle && accentEnd) || accentStart,
      },
    }
    const styleCID = await ipfsEndpoints.dag.put(style)
    const logoCID = image ? await ipfsEndpoints.add(image) : ''
    const brand = {
      style_cid: styleCID,
      logo_cid: logoCID,
    }

    setDagInOrgDataStore(ORG_SETTINGS_BRAND, brand)
  }

  const resetBrand = () => {
    setImage()
    setBackground(true)
    setPreviewOpen(false)
    setAccentStyle(0)
    setAccentStart('')
    setAccentEnd('')
    saveBrand()
  }

  const openPreview = () => setPreviewOpen(true)
  const closePreview = () => setPreviewOpen(false)

  return (
    <Box padding={3 * GU} heading="Brand">
      <div
        css={`
          display: flex;
          width: 100%;
          margin-bottom: ${2 * GU}px;
        `}
      >
        <div
          css={`
            display: flex;
            flex-direction: column;
            width: 50%;
            padding-right: ${2 * GU}px;
          `}
        >
          <Label text="Logo" />
          <div
            css={`
              width: 217px;
              margin: ${2 * GU}px 0;
            `}
          >
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
                        padding: 30px;
                        selectedbuttonstyle,setbuttonstylemargin-bottom: 10px;
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
                        src={
                          URL.createObjectURL(image) ||
                          organizationLogoPlaceholder
                        }
                        alt=""
                      />
                    </div>
                  ) : (
                    <Button label="Upload new logo" icon={<IconUpload />} />
                  )}
                </div>
              )}
            </Dropzone>
          </div>
          <Info css="width: 100%">Please keep 1:1 ratio</Info>
        </div>
        <div
          css={`
            display: flex;
            flex-direction: column;
            width: 50%;
            padding-left: ${2 * GU}px;
          `}
        >
          <Label text="Background image" />
          <div
            css={`
              display: flex;
              width: 100%;
              justify-content: space-between;
              margin: ${3 * GU}px 0;
            `}
          >
            <span>Include Aragon eagle in the background</span>
            <Switch checked={background} onChange={setBackground} />
          </div>
          <Label text="Accent color hex" />
          <div>
            <DropDown
              css={`
                min-width: 140px;
                margin: ${2 * GU}px 0;
              `}
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
                  margin-bottom: ${2 * GU}px;
                `}
                value={accentStart}
                placeholder={accentStyle === 1 ? 'First hex' : ''}
                onChange={changeAccentStart}
              />
              {accentStyle === 1 && (
                <TextInput
                  css={`
                    border: 1px solid ${colorError ? 'red' : '#DDE4E9'};
                    width: 120px;
                    margin-right: ${2 * GU}px;
                    margin-bottom: ${2 * GU}px;
                  `}
                  value={accentEnd}
                  placeholder="Second hex"
                  onChange={changeAccentEnd}
                />
              )}
              <Button label="Preview" onClick={openPreview} />
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
        mode="strong"
        label="Save changes"
        css={`
          margin-right: ${2 * GU}px;
        `}
        onClick={saveBrand}
      />
      <Button label="Reset brand" onClick={resetBrand} />
      <Modal visible={previewOpen} onClose={closePreview}>
        <h2
          css={`
            ${textStyle('title2')};
            margin-bottom: ${4 * GU}px;
          `}
        >
          Accent preview
        </h2>
        <p
          css={`
            margin-bottom: ${2 * GU}px;
          `}
        >
          Here's how your new accent styling would like on a button.
        </p>
        <Button
          mode="strong"
          label="Hello world"
          css={
            accentStart &&
            `
            background: linear-gradient( 190deg, ${accentStart} -100%, ${(accentStyle &&
              accentEnd) ||
              accentStart} 80% ) !important;
          `
          }
        />
        <div
          css={`
            margin-top: ${2 * GU}px;
            text-align: right;
          `}
        >
          <Button label="Go back" onClick={closePreview} />
        </div>
      </Modal>
    </Box>
  )
}

export default Brand

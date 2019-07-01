import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { Button, DropDown, Field, TextInput } from '@aragon/ui'

import { AppType } from '../../prop-types'
import AragonStorage from '../../storage/storage-wrapper'

import Option from './Option'

const defaultOption = 'Use the default'

class HomeSettings extends React.Component {
  static propTypes = {
    apps: PropTypes.arrayOf(AppType).isRequired,
  }
  state = {
    homeAppAlias: 'Home',
    selectedhomeAppAlias: defaultOption,
    storageApp: null,
    dirty: false,
  }

  async getHomeSettings(props) {
    const { apps, homeSettings } = props
    const { dirty } = this.state
    const storageApp = apps.find(({ name }) => name === 'Storage')

    if (storageApp && storageApp.proxyAddress && !dirty) {
      const selectedHomeApp = apps.find(
        ({ proxyAddress }) => proxyAddress === homeSettings.address
      )
      this.setState({
        homeAppAlias: homeSettings.name || 'Home',
        selectedhomeAppAlias:
          (selectedHomeApp && selectedHomeApp.name) || defaultOption,
        storageApp: apps.find(({ name }) => name === 'Storage'),
      })
    }
  }

  componentWillReceiveProps(nextProps) {
    this.getHomeSettings(nextProps)
  }
  componentWillMount() {
    this.getHomeSettings(this.props)
  }

  handleHomeAppChange = (index, apps) => {
    this.setState({ selectedhomeAppAlias: apps[index], dirty: true })
  }

  handleHomeNameChange = event => {
    this.setState({
      homeAppAlias: event.target.value && event.target.value.trim(),
      dirty: true,
    })
  }

  handleHomeSettingsSave = async () => {
    const { apps, wrapper } = this.props
    const { storageApp, selectedhomeAppAlias, homeAppAlias } = this.state

    if (storageApp && storageApp.proxyAddress) {
      const selectedAppAddr = apps.find(
        ({ name }) => name === selectedhomeAppAlias
      )

      try {
        await AragonStorage.set(wrapper, storageApp.proxyAddress, {
          HOME_APP_NAME: homeAppAlias,
          HOME_APP: (selectedAppAddr && selectedAppAddr.proxyAddress) || '',
        })

        this.setState({
          dirty: false,
        })
      } catch (err) {
        console.log(err)
      }
    }
  }

  render() {
    const { apps } = this.props
    const { homeAppAlias, selectedhomeAppAlias, storageApp } = this.state

    const reducedAppNames = apps.reduce(
      (filtered, app) => {
        app.hasWebApp && filtered.push(app.name)
        return filtered
      },
      [defaultOption]
    )
    if (!storageApp) return <div />

    return (
      <Option
        name="Home Page"
        text={`The default home page is a list of shortcuts to other apps. You can set another home page, which can be any of your existing apps. You might want to install the Home app first and select that!`}
      >
        <WideFlex>
          <Field label="Select app">
            <DropDown
              active={reducedAppNames.indexOf(selectedhomeAppAlias)}
              items={reducedAppNames}
              onChange={this.handleHomeAppChange}
              wide
            />
          </Field>
          {selectedhomeAppAlias !== defaultOption ? (
            <Field label="Enter tab name">
              <TextInput
                onChange={this.handleHomeNameChange}
                value={homeAppAlias}
                wide
              />
            </Field>
          ) : (
            <Field />
          )}
        </WideFlex>
        <Button mode="strong" onClick={this.handleHomeSettingsSave}>
          Submit Changes
        </Button>
      </Option>
    )
  }
}

const WideFlex = styled.div`
  display: flex;
  > * {
    flex: 1;
  }
  > :last-child {
    margin-left: 20px;
  }
`

export default HomeSettings

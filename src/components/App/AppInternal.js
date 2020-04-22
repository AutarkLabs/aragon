import React from 'react'
import PropTypes from 'prop-types'
import { Layout, ScrollView } from '@aragon/ui'
import useAppWidth from '../../apps/useAppWidth'

function AppInternal({ children }) {
  const appWidth = useAppWidth()
  return (
    <ScrollView>
      <Layout css="height: 100%" parentWidth={appWidth}>
        {children}
      </Layout>
    </ScrollView>
  )
}

AppInternal.propTypes = {
  children: PropTypes.node,
}

export default AppInternal

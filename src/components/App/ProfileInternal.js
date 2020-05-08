import React from 'react'
import PropTypes from 'prop-types'
import { ScrollView } from '@aragon/ui'
import { Profile } from '@openworklabs/aragon-profile'
import useAppWidth from '../../apps/useAppWidth'

function ProfileInternal({
  account,
  enableWallet,
  locator,
  onSignatures,
  web3Provider,
}) {
  const appWidth = useAppWidth()
  const parts = locator.instancePath.split('/')
  parts.shift()
  return (
    <ScrollView>
      <Profile
        account={account}
        appWidth={appWidth}
        enableWallet={enableWallet}
        onSignatures={onSignatures}
        parts={parts}
        web3Provider={web3Provider}
      />
    </ScrollView>
  )
}

ProfileInternal.propTypes = {
  account: PropTypes.string,
  enableWallet: PropTypes.func.isRequired,
  locator: PropTypes.object.isRequired,
  onSignatures: PropTypes.func.isRequired,
  web3Provider: PropTypes.object.isRequired,
}

export default ProfileInternal

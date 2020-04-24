import React, { useCallback, useContext } from 'react'
import PropTypes from 'prop-types'
import { IconLabel, GU } from '@aragon/ui'
import { LocalIdentityModalContext } from '../LocalIdentityModal/LocalIdentityModalManager'
import { useWallet } from '../../wallet'
import { useLocalIdentity } from '../../hooks'
import { addressesEqual, isAddress } from '../../web3-utils'
import {
  IdentityContext,
  identityEventTypes,
} from '../IdentityManager/IdentityManager'
import IdentityBadgeWithNetwork from './IdentityBadgeWithNetwork'
import LocalIdentityPopoverTitle from './LocalIdentityPopoverTitle'

function LocalIdentityBadge({ entity, forceAddress, ...props }) {
  const address = isAddress(entity) ? entity : null
  const { onNavigateToProfile, identityEvents$ } = useContext(IdentityContext)
  const { showLocalIdentityModal } = useContext(LocalIdentityModalContext)
  const localIdentity = useLocalIdentity(address)
  const { name: label, source, handleResolve } = localIdentity
  const wallet = useWallet()

  const handleCustomLabel = useCallback(() => {
    if (source === 'addressBook') return
    showLocalIdentityModal(address)
      .then(handleResolve)
      .then(() =>
        identityEvents$.next({ type: identityEventTypes.MODIFY, address })
      )
      .catch(e => {
        /* user cancelled modify intent */
      })
  }, [address, identityEvents$, source, handleResolve, showLocalIdentityModal])

  const handleProfile = useCallback(() => {
    onNavigateToProfile(address)
  }, [address, onNavigateToProfile])

  const popoverAction = ({ label, onClick }) => {
    return {
      label: (
        <div
          css={`
            display: flex;
            align-items: center;
          `}
        >
          <IconLabel
            css={`
              margin-right: ${1 * GU}px;
            `}
          />
          {label}
        </div>
      ),
      onClick: onClick,
    }
  }

  const getPopoverAction = () => {
    if (source === 'addressBook') return null
    if (source === '3box') {
      const popoverLabel = 'View profile'
      return popoverAction({ label: popoverLabel, onClick: handleProfile })
    }
    const popoverLabel = `${label ? 'Edit' : 'Add'} custom label`
    return popoverAction({ label: popoverLabel, onClick: handleCustomLabel })
  }

  if (address === null) {
    return <IdentityBadgeWithNetwork {...props} label={entity} />
  }

  return (
    <IdentityBadgeWithNetwork
      {...props}
      connectedAccount={addressesEqual(address, wallet.account)}
      entity={address}
      label={(!forceAddress && label) || ''}
      popoverAction={getPopoverAction()}
      popoverTitle={
        label ? (
          <LocalIdentityPopoverTitle label={label} source={source} />
        ) : (
          'Address'
        )
      }
    />
  )
}

LocalIdentityBadge.propTypes = {
  entity: PropTypes.string,
  forceAddress: PropTypes.bool,
}

export default LocalIdentityBadge

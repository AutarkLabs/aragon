import React from 'react'
import PropTypes from 'prop-types'
import { GU, EthIdenticon } from '@aragon/ui'
import { network } from '../../environment'
import { getKnownOrganization } from '../../known-organizations'
import { EthereumAddressType } from '../../prop-types'
import { getOrgData } from '../../organizationProfile'

function OrgIcon({ orgAddress, size }) {
  const knownOrg = getOrgData() || getKnownOrganization(network.type, orgAddress)
  const knownOrgImage = knownOrg && knownOrg.image

  return (
    <div
      css={`
        overflow: hidden;
        width: ${size}px;
        height: ${size}px;
        flex-shrink: 0;
        flex-grow: 0;
        display: inline-flex;
        justify-content: center;
        align-items: center;
      `}
    >
      {knownOrgImage ? (
        <img
          src={knownOrgImage}
          width={size}
          height={size}
          alt=""
          css="object-fit: contain"
        />
      ) : (
        <EthIdenticon
          address={orgAddress}
          css={`
            border-radius: 50%;
          `}
        />
      )}
    </div>
  )
}
OrgIcon.propTypes = {
  orgAddress: EthereumAddressType.isRequired,
  size: PropTypes.number,
}
OrgIcon.defaultProps = {
  size: 3 * GU,
}

export default OrgIcon

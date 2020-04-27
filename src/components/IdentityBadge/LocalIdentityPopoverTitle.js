import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { Tag, GU } from '@aragon/ui'

const getTag = source => {
  if (source === '3box') return '3Box'
  if (source === 'addressBook') return 'Address Book'
  return 'Custom Label'
}

const LocalIdentityPopoverTitle = ({ label, source }) => {
  return (
    <WrapTitle>
      <Label>{label}</Label>
      <Tag
        mode="identifier"
        css={`
          margin-left: ${1 * GU}px;
        `}
      >
        {getTag(source)}
      </Tag>
    </WrapTitle>
  )
}

LocalIdentityPopoverTitle.propTypes = {
  label: PropTypes.string.isRequired,
}

const WrapTitle = styled.div`
  display: grid;
  align-items: center;
  grid-template-columns: auto 1fr;
`

const Label = styled.span`
  display: inline-block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

export default LocalIdentityPopoverTitle

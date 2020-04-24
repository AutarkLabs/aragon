import React from 'react'
import PropTypes from 'prop-types'
import styled, { keyframes } from 'styled-components'
import { useTheme } from '@aragon/ui'

const ProfilePic = ({ size, imgSrc, loading }) => {
  const theme = useTheme()
  if (loading) {
    return (
      <div
        css={`
          background-color: ${theme.badge};
          border-radius: 50%;
          width: ${size}px;
          height: ${size}px;
        `}
      >
        <Loading theme={theme}> </Loading>
      </div>
    )
  }
  return (
    <img
      src={imgSrc}
      alt="Profile picture"
      css={`
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
      `}
    />
  )
}

ProfilePic.propTypes = {
  size: PropTypes.number.isRequired,
  imgSrc: PropTypes.string,
  loading: PropTypes.bool.isRequired,
}

const pulse = keyframes`
  0% {
    background-position: -64px 0
  }
  100% {
    background-position: 64px 0
  }
`

const Loading = styled.div`
  animation: 5s ${pulse} infinite linear;
  ${({ theme }) => {
    return `
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: -webkit-gradient(linear, left top, right top,
        color-stop(5%, ${theme.badge}),
        color-stop(25%, rgba(127, 127, 127, 0.1)),
        color-stop(45%, ${theme.badge})
      );
      background: -webkit-linear-gradient(left,
        ${theme.badge} 5%,
        rgba(127, 127, 127, 0.1) 25%,
        ${theme.badge} 45%);
      background: linear-gradient(to right,
        ${theme.badge} 5%,
        rgba(127, 127, 127, 0.1) 25%,
        ${theme.badge} 45%);
    `
  }}
`

export default ProfilePic

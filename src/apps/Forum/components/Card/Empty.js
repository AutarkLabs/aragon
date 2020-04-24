import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { useAragonApi } from '../../../../contexts/AppContext'
import {
  Button,
  EmptyStateCard,
  GU,
  LoadingRing,
  textStyle,
  useTheme,
} from '@aragon/ui'
import emptyState from '../../assets/empty-state.svg'

const illustration = <img src={emptyState} alt="No threads" height="160" />

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: calc(100vh - ${14 * GU}px);
`

const Empty = ({ onClick }) => {
  const theme = useTheme()
  const {
    appState: { isSyncing },
  } = useAragonApi()

  return (
    <Wrapper>
      <EmptyStateCard
        text={
          isSyncing ? (
            <div
              css={`
                display: grid;
                align-items: center;
                justify-content: center;
                grid-template-columns: auto auto;
                grid-gap: ${1 * GU}px;
              `}
            >
              <LoadingRing />
              <span>Syncing…</span>
            </div>
          ) : (
            <>
              <h2
                css={`
                  color: ${theme.surfaceContent};
                  ${textStyle('title4')};
                `}
              >
                No threads available
              </h2>
              <p
                css={`
                  color: ${theme.surfaceContentSecondary};
                  text-align: center;
                  ${textStyle('body2')};
                `}
              >
                Why not create a new thread yourself?
              </p>
            </>
          )
        }
        illustration={illustration}
        action={<Button onClick={onClick}>New thread</Button>}
      />
    </Wrapper>
  )
}

Empty.propTypes = {
  onClick: PropTypes.func.isRequired,
}

export default Empty

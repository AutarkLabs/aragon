import React, { useContext, useCallback } from 'react'
import PropTypes from 'prop-types'
import { Subject } from 'rxjs'
import { getAppPath } from '../../routing'

const identityEventTypes = {
  IMPORT: 'IMPORT',
  MODIFY: 'MODIFY',
  REMOVE: 'REMOVE',
}

// An events subject
// { type: '<string>', address: <string> }
const identityEvents$ = new Subject()

const IdentityContext = React.createContext({
  resolve: () =>
    Promise.reject(Error('Please set resolve using IdentityProvider')),
})

const IdentityProvider = ({ locator, onResolve, children }) => {
  const onNavigateToProfile = useCallback(
    address => {
      window.location = `/#${getAppPath({
        dao: locator.dao,
        instanceId: 'profile',
      })}${address}`
    },
    [locator]
  )

  return (
    <IdentityContext.Provider
      value={{ resolve: onResolve, onNavigateToProfile, identityEvents$ }}
    >
      {children}
    </IdentityContext.Provider>
  )
}

IdentityProvider.propTypes = {
  locator: PropTypes.object.isRequired,
  onResolve: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
}

const IdentityConsumer = IdentityContext.Consumer

const useIdentity = () => useContext(IdentityContext)

export {
  IdentityProvider,
  IdentityConsumer,
  IdentityContext,
  identityEventTypes,
  useIdentity,
}

import { useCallback, useContext, useEffect } from 'react'
import { AppStateContext } from '../context/AppStateContext'

export default function usePathHelpers() {
  function usePath() {
    const context = useContext(AppStateContext)
    if (!context) {
      throw new Error('usePath must be used within a AppStateProvider')
    }
    return [
      context.locator.instancePath,
      newPath => {
        const instancePath =
          newPath.charAt(0) === '/' ? newPath.substr(1) : newPath
        /*
        context.historyPush(
          `${getAppPath({
            dao: context.locator.dao,
            instanceId: context.locator.instanceId,
          })}${truncPath}`
        )
        */
        context.onPathRequest(instancePath)
      },
    ]
  }

  const [path, requestPath] = usePath()

  const history = []

  useEffect(() => {
    if (path !== history[history.length - 1]) {
      history.push(path)
    }
  }, [history, path])

  // Since goBack is not supported in aragonAPI, we do not have access to
  // actual browser history. If the user refreshes their page then fires a
  // `goBack` action, we will have nothing in our custom `history` array.
  // The `fallback` option allows us to work around this.
  const goBack = useCallback(
    (fallback = '/') => {
      history.pop() // remove current page, forget about it (goForward not supported)
      const prev = history.pop()
      requestPath(prev || fallback)
    },
    [history, requestPath]
  )

  // accepts a pattern like '/budgets/:id', where ':id' is a named parameter
  // redirects to '/' if the current path doesn't match at all
  // otherwise, returns an object with keys matching the named parameters and
  // values filled in from the current path
  const parsePath = useCallback(
    pattern => {
      const namedParameters = pattern.match(/(:[a-zA-Z]+)/g)

      // replace named paramaters with regex-compatible capture groups
      namedParameters.forEach(x => {
        pattern = pattern.replace(x, '([a-zA-Z0-9-+_!@#$%^&*=]+)')
      })

      const matchData = path.match(pattern)
      if (!matchData) return {}

      const groups = namedParameters.reduce((acc, namedParameter, index) => {
        acc[namedParameter.slice(1)] = matchData[index + 1]
        return acc
      }, {})

      return groups
    },
    [path]
  )

  return { goBack, parsePath, requestPath }
}

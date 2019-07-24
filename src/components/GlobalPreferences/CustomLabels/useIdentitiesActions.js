import { useState, useMemo, useCallback } from 'react'
import { format } from 'date-fns'
import { saveAs } from 'file-saver'
import {
  useIdentity,
  identityEventTypes,
} from '../../IdentityManager/IdentityManager'
import { utoa } from '../../../string-utils'
import { log } from '../../../utils'
import {
  getAppPath,
  GLOBAL_PREFERENCES_QUERY_PARAM,
  GLOBAL_PREFERENCES_SHARE_LINK_QUERY_VAR,
} from '../../../routing'

const CUSTOM_LABELS_PATH = 'custom-labels'

function useIdentitiesActions({
  wrapper,
  filteredIdentities,
  identitiesSelected,
  locator,
  someSelected,
}) {
  const { dao } = locator
  const { identityEvents$ } = useIdentity()

  // share
  const [shareModalOpened, setShareModalOpened] = useState(false)
  const shareLink = useMemo(() => {
    const identitiesToShare = filteredIdentities.reduce(
      (p, c) => [...p, ...(identitiesSelected.get(c.address) ? [c] : [])],
      []
    )
    try {
      const labels = utoa(JSON.stringify(identitiesToShare))
      const path = `${window.location.origin}/#${getAppPath(
        locator
      )}${GLOBAL_PREFERENCES_QUERY_PARAM}${CUSTOM_LABELS_PATH}${GLOBAL_PREFERENCES_SHARE_LINK_QUERY_VAR}${labels}`
      return path
    } catch (err) {
      log('Error while creating the identities sharing link:', err)
      return ''
    }
  }, [filteredIdentities, identitiesSelected, locator])

  // import
  const handleImport = useCallback(
    async list => {
      if (!wrapper) {
        return
      }
      await Promise.all(
        list.map(({ name, address }) =>
          wrapper.modifyAddressIdentity(address, { name })
        )
      )
      identityEvents$.next({ type: identityEventTypes.IMPORT })
    },
    [wrapper, identityEvents$]
  )

  // export
  const handleExport = useCallback(() => {
    if (!someSelected) {
      return
    }
    // standard: https://en.wikipedia.org/wiki/ISO_8601
    const today = format(Date.now(), 'yyyy-MM-dd')
    const blob = new Blob(
      [
        JSON.stringify(
          filteredIdentities.filter(({ address }) =>
            identitiesSelected.get(address)
          )
        ),
      ],
      { type: 'text/json' }
    )
    saveAs(blob, `aragon-labels_${dao}_${today}.json`)
  }, [someSelected, filteredIdentities, identitiesSelected, dao])

  // remove
  const [removeModalOpened, setRemoveModalOpened] = useState(false)
  const handleRemove = useCallback(async () => {
    if (!wrapper) {
      return
    }
    const toRemove = filteredIdentities
      .filter(({ address }) => identitiesSelected.get(address))
      .map(({ address }) => address)
    await wrapper.removeLocalIdentities(toRemove)
    setRemoveModalOpened(false)
    identityEvents$.next({
      type: identityEventTypes.REMOVE,
      addresses: toRemove,
    })
  }, [
    filteredIdentities,
    identitiesSelected,
    identityEvents$,
    setRemoveModalOpened,
    wrapper,
  ])

  return {
    // share
    handleShareModalOpen: useCallback(() => {
      if (someSelected) {
        setShareModalOpened(true)
      }
    }, [someSelected, setShareModalOpened]),
    handleShareModalClose: useCallback(() => setShareModalOpened(false), [
      setShareModalOpened,
    ]),
    shareModalOpened,
    shareLink,
    // import
    handleImport,
    // export
    handleExport,
    // remove
    handleRemove,
    handleRemoveModalClose: () => setRemoveModalOpened(false),
    handleRemoveModalOpen: useCallback(() => {
      if (someSelected) {
        setRemoveModalOpened(true)
      }
    }, [someSelected, setRemoveModalOpened]),
    removeModalOpened,
  }
}

export default useIdentitiesActions
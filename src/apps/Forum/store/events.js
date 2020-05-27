import { updateThread, deleteThread } from './threads'

const eventHandler = async (_api, eventData) => {
  const {
    event: { event, returnValues },
    state,
  } = eventData

  switch (event) {
    case 'SYNC_STATUS_SYNCING': {
      return {
        ...state,
        isSyncing: true,
      }
    }
    case 'SYNC_STATUS_SYNCED': {
      return {
        ...state,
        isSyncing: false,
      }
    }
    case 'UpdateThread':
      return {
        ...state,
        threads: await updateThread(state, returnValues),
      }
    case 'DeleteThread':
      const threads = await deleteThread(state, returnValues)
      return {
        ...state,
        threads,
      }
    default:
      return { ...state }
  }
}

export default eventHandler

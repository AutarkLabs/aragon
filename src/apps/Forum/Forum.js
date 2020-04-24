import React, { useState, useEffect } from 'react'
import { useAragonApi, usePathHelpers } from '../../contexts/AppContext'
import { Button, GU, Header, IconPlus, SyncIndicator } from '@aragon/ui'
import { Empty } from './components/Card'
import { Threads, ThreadDetail } from './components/Content'
import { ThreadModal } from './components/Modal'
import { use3Box } from '../../hooks'

const Forum = () => {
  const {
    appState: { threads = [], isSyncing },
  } = useAragonApi()
  const {
    activateThread,
    activeThreadAddress,
    activeThreadName,
    deactivateThread,
  } = use3Box()
  const { parsePath, requestPath } = usePathHelpers()
  const { threadName } = parsePath('^/threads/:threadName')
  const [verifiedThread, setVerifiedThread] = useState()
  const [modalVisible, setModalVisible] = useState(false)

  function processThreads(threads, context) {
    let filteredThreads
    if (context) {
      filteredThreads = threads.filter(thread => thread.context === context)
    } else {
      filteredThreads = threads
    }
    filteredThreads.reverse()
    return filteredThreads
  }

  function verifyThread(threads, threadName) {
    const thread = threads.find(thread => thread.name === threadName)
    return thread
  }

  const handleBack = () => {
    requestPath('/')
    deactivateThread()
  }

  const processedThreads = processThreads(threads, 'forum')

  useEffect(() => {
    if (threadName) {
      const thread = verifyThread(processedThreads, threadName)
      if (thread && thread.address !== activeThreadAddress) {
        setVerifiedThread(thread)
        activateThread(thread.address)
      }
    } else {
      setVerifiedThread(undefined)
      if (activeThreadAddress || activeThreadName) deactivateThread()
    }
  }, [
    processedThreads,
    threadName,
    activateThread,
    activeThreadAddress,
    activeThreadName,
    deactivateThread,
  ])

  return (
    <>
      {processedThreads.length === 0 ? (
        <Empty onClick={() => setModalVisible(true)} />
      ) : (
        <>
          <Header
            primary={verifiedThread ? verifiedThread.title : 'Forum'}
            secondary={
              !threadName && (
                <Button
                  mode="strong"
                  icon={<IconPlus />}
                  onClick={() => setModalVisible(true)}
                  label="New thread"
                />
              )
            }
            onBack={verifiedThread ? () => handleBack() : null}
            css={`
              @media only screen and (max-width: 600px) {
                padding: ${2 * GU}px 0;
              }
            `}
          />
          {verifiedThread ? (
            <ThreadDetail thread={verifiedThread} />
          ) : (
            <Threads threads={processedThreads} />
          )}
        </>
      )}
      <ThreadModal
        visible={modalVisible}
        closeModal={() => setModalVisible(false)}
      />
      <SyncIndicator visible={isSyncing} />
    </>
  )
}

export default Forum

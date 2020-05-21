import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { use3Box } from '../../../../hooks'
import {
  Button,
  ButtonBase,
  Card,
  GU,
  IconChat,
  IconEdit,
  IconTrash,
  Modal,
  textStyle,
  useTheme,
} from '@aragon/ui'
import { formatDistance } from 'date-fns'
import Markdown from '../Markdown/Markdown'
import Preview from '../Markdown/Preview'
import LoadingAnimation from '../Modal/LoadingAnimation'
import { useWallet } from '../../../../wallet'
import { useAragonApi, usePathHelpers } from '../../hooks'
import { ipfsAdd } from '../../../../ipfs'
import { NewPost, Posts } from './'
import LocalIdentityBadge from '../../../../components/IdentityBadge/LocalIdentityBadge'

const ThreadDetail = ({ thread }) => {
  const {
    activePosts,
    deactivateThread,
    loadingThread,
    userCanPost,
  } = use3Box()
  const [threadDescription, setThreadDescription] = useState(thread.description)
  const [editingThread, setEditingThread] = useState(false)
  const [showDeleteThreadModal, setShowDeleteThreadModal] = useState(false)
  const { account } = useWallet()
  const { api } = useAragonApi()
  const { requestPath } = usePathHelpers()
  const theme = useTheme()

  const startEditThread = () => {
    setEditingThread(true)
  }

  const cancelEditThread = () => {
    setEditingThread(false)
  }

  const submitEditThread = async () => {
    const metadata = thread
    metadata.description = threadDescription
    const cId = await ipfsAdd(metadata)
    await api.editThread(thread.address, cId)
    setEditingThread(false)
  }

  const startDeleteThread = () => {
    setShowDeleteThreadModal(true)
  }

  const cancelDeleteThread = () => {
    setShowDeleteThreadModal(false)
  }

  const submitDeleteThread = async () => {
    await api.deleteThread(thread.address)
    requestPath('/')
    deactivateThread()
  }

  return (
    <div>
      <Card
        width="100%"
        height="auto"
        css={`
          margin-bottom: ${2 * GU}px;
          padding: ${3 * GU}px;
        `}
      >
        <div
          css={`
            width: 100%;
            display: flex;
            flex-direction: column;
          `}
        >
          <div
            css={`
              display: flex;
              justify-content: space-between;
              margin-bottom: ${GU}px;
            `}
          >
            <LocalIdentityBadge entity={thread.author} />
            {!editingThread && (
              <div
                css={`
                  ${textStyle('body3')};
                  font-weight: 500;
                  color: ${theme.contentSecondary};
                `}
              >
                {formatDistance(thread.creationDate, new Date())} ago
              </div>
            )}
          </div>
          {editingThread ? (
            <div>
              <div>
                <Markdown
                  data={threadDescription}
                  setData={setThreadDescription}
                />
              </div>
              <div
                css={`
                  display: flex;
                  justify-content: flex-end;
                `}
              >
                <div
                  css={`
                    margin-right: ${GU}px;
                  `}
                >
                  <Button
                    label="Cancel"
                    onClick={cancelEditThread}
                    css={`
                      color: ${theme.contentSecondary};
                      background: ${theme.border};
                    `}
                  />
                </div>
                <div>
                  <Button
                    label="Submit"
                    mode="strong"
                    onClick={submitEditThread}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div
                css={`
                  ${textStyle('body2')};
                  margin-bottom: ${2 * GU}px;
                  color: ${theme.surfaceContent};
                `}
              >
                <Preview content={thread.description} />
              </div>
              <div
                css={`
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                `}
              >
                <div
                  css={`
                    display: flex;
                    align-items: center;
                    line-height: 1;
                  `}
                >
                  <div
                    css={`
                      margin-right: ${GU}px;
                    `}
                  >
                    <IconChat />
                  </div>
                  <div
                    css={`
                      ${textStyle('body2')};
                      font-weight: 500;
                      color: ${theme.surfaceContent};
                    `}
                  >
                    {activePosts.length}
                  </div>
                </div>
                {thread.author === account && (
                  <div
                    css={`
                      display: flex;
                    `}
                  >
                    <div
                      css={`
                        margin-right: ${2 * GU}px;
                      `}
                    >
                      <ButtonBase
                        onClick={() => {
                          startEditThread()
                        }}
                      >
                        <IconEdit />
                      </ButtonBase>
                    </div>
                    <div>
                      <ButtonBase
                        onClick={() => {
                          startDeleteThread()
                        }}
                      >
                        <IconTrash />
                      </ButtonBase>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>
      <div>
        {loadingThread ? (
          <div
            css={`
              text-align: center;
              padding: ${4 * GU}px;
            `}
          >
            <div>
              <LoadingAnimation />
            </div>
            <div
              css={`
                ${textStyle('body2')}
                font-weight: 500;
                color: ${theme.disabledIcon};
              `}
            >
              Loading posts...
            </div>
          </div>
        ) : (
          <div>
            <Posts />
          </div>
        )}
      </div>
      {!loadingThread && userCanPost() && <NewPost />}
      <Modal
        visible={showDeleteThreadModal}
        onClose={cancelDeleteThread}
        padding={0}
      >
        <div
          css={`
            display: flex;
            flex-direction: column;
          `}
        >
          <div
            css={`
              ${textStyle('title3')};
              font-weight: 600;
              color: ${theme.surfaceContent};
              border-bottom: 1px solid ${theme.border};
              padding: ${3 * GU}px;
              line-height: 1;
            `}
          >
            Remove thread
          </div>
          <div
            css={`
              padding: ${3 * GU}px;
            `}
          >
            <div
              css={`
                ${textStyle('body2')};
                font-weight: 500;
                color: ${theme.surfaceContent};
                margin-bottom: ${3 * GU}px;
              `}
            >
              Are you sure you want to remove your thread? Once your thread has
              been removed, you won’t be able to recover it.
            </div>
            <div
              css={`
                display: flex;
                justify-content: flex-end;
              `}
            >
              <div
                css={`
                  margin-right: ${GU}px;
                `}
              >
                <Button
                  label="Cancel"
                  onClick={cancelDeleteThread}
                  css={`
                    color: ${theme.contentSecondary};
                    background: ${theme.border};
                  `}
                />
              </div>
              <div>
                <Button
                  label="Remove"
                  onClick={submitDeleteThread}
                  mode="strong"
                />
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

ThreadDetail.propTypes = {
  thread: PropTypes.shape({
    address: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    context: PropTypes.string.isRequired,
    creationDate: PropTypes.object.isRequired,
    author: PropTypes.string.isRequired,
  }),
}

export default ThreadDetail

import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { EthereumAddressType } from '../../../../prop-types'
import {
  ButtonBase,
  Button,
  Card,
  GU,
  IconEdit,
  IconTrash,
  textStyle,
  useTheme,
} from '@aragon/ui'
import { formatDistance } from 'date-fns'
import Markdown from '../Markdown/Markdown'
import Preview from '../Markdown/Preview'
import { use3Box } from '../../../../hooks'
import { DeleteModal } from '../Modal'
import LocalIdentityBadge from '../../../../components/IdentityBadge/LocalIdentityBadge'

const Post = ({ author, account, creationDate, message, postId }) => {
  const theme = useTheme()
  const [editing, setEditing] = useState(false)
  const [newMessage, setNewMessage] = useState(message)
  const [deleting, setDeleting] = useState(false)
  const [hasPermissions, setHasPermissions] = useState(false)
  const { deletePost, isCurrentUser, newPost } = use3Box()

  useEffect(() => {
    const getHasPermissions = async () => {
      setHasPermissions(await isCurrentUser(author))
    }
    getHasPermissions()
  }, [isCurrentUser, author])

  const startEdit = () => {
    setEditing(true)
  }

  const cancelEdit = () => {
    setEditing(false)
  }

  const submitEdit = async () => {
    const editObject = { originalPostId: postId, newMessage }
    const editMessage = JSON.stringify(editObject)
    await newPost(editMessage)
    setEditing(false)
  }

  const startDelete = () => {
    setDeleting(true)
  }

  const cancelDelete = () => {
    setDeleting(false)
  }

  const submitDelete = async () => {
    await deletePost(postId)
    setDeleting(false)
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
            <LocalIdentityBadge entity={account} />
            {!editing && (
              <div
                css={`
                  ${textStyle('body3')};
                  font-weight: 500;
                  color: ${theme.contentSecondary};
                `}
              >
                {formatDistance(creationDate, new Date())} ago
              </div>
            )}
          </div>
          {editing ? (
            <div>
              <div>
                <Markdown data={message} setData={setNewMessage} />
              </div>
              <div
                css={`
                  display: flex;
                  justify-content: flex-end;
                  align-items: flex-end;
                `}
              >
                <div
                  css={`
                    margin-right: ${GU}px;
                  `}
                >
                  <Button
                    label="Cancel"
                    onClick={cancelEdit}
                    css={`
                      color: ${theme.contentSecondary};
                      background: ${theme.border};
                    `}
                  />
                </div>
                <div>
                  <Button label="Submit" mode="strong" onClick={submitEdit} />
                </div>
              </div>
            </div>
          ) : (
            <div
              css={`
                display: flex;
                justify-content: flex-end;
              `}
            >
              <div
                css={`
                  ${textStyle('body2')};
                  color: ${theme.surfaceContent};
                  flex-grow: 1;
                  overflow-x: hidden;
                  overflow-wrap: break-word;
                `}
              >
                <Preview content={message} />
              </div>
              {hasPermissions && (
                <>
                  <div
                    css={`
                      margin-left: ${2 * GU}px;
                      margin-right: ${2 * GU}px;
                    `}
                  >
                    <ButtonBase onClick={startEdit}>
                      <IconEdit size="medium" />
                    </ButtonBase>
                  </div>
                  <div>
                    <ButtonBase onClick={startDelete}>
                      <IconTrash size="medium" />
                    </ButtonBase>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </Card>
      <DeleteModal
        visible={deleting}
        onClose={cancelDelete}
        onSubmit={submitDelete}
      />
    </div>
  )
}

Post.propTypes = {
  account: EthereumAddressType,
  author: PropTypes.string.isRequired,
  creationDate: PropTypes.instanceOf(Date).isRequired,
  message: PropTypes.string.isRequired,
  postId: PropTypes.string.isRequired,
}

export default Post

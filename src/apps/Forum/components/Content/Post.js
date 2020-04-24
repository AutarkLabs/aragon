import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { Button, Card, GU, Link, textStyle, useTheme } from '@aragon/ui'
import { formatDistance } from 'date-fns'
import Markdown from '../Markdown/Markdown'
import Preview from '../Markdown/Preview'
import { use3Box } from '../../../../hooks'
import { EditIcon, TrashIcon } from '../Icon'
import { DeleteModal } from '../Modal'

const Post = ({ author, image, name, creationDate, message, postId }) => {
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
            `}
          >
            <div
              css={`
                display: flex;
                margin-bottom: ${GU}px;
              `}
            >
              <div
                css={`
                  margin-right: ${GU}px;
                `}
              >
                <img
                  src={image}
                  width={3 * GU}
                  height={3 * GU}
                  css={`
                    border-radius: 50%;
                  `}
                />
              </div>
              <div
                css={`
                  ${textStyle('body2')};
                  font-weight: 500;
                  color: ${theme.disabledIcon};
                `}
              >
                {name}
              </div>
            </div>
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
                    <Link onClick={startEdit}>
                      <EditIcon />
                    </Link>
                  </div>
                  <div>
                    <Link onClick={startDelete}>
                      <TrashIcon />
                    </Link>
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
  author: PropTypes.string.isRequired,
  image: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  creationDate: PropTypes.instanceOf(Date).isRequired,
  message: PropTypes.string.isRequired,
  postId: PropTypes.string.isRequired,
}

export default Post

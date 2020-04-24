import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Button, GU, Modal, TextInput, textStyle, useTheme } from '@aragon/ui'
import { use3Box } from '../../../../hooks'
import Markdown from '../Markdown/Markdown'
import LoadingAnimation from './LoadingAnimation'
import { ipfsAdd } from '../../../../ipfs'
import { useAragonApi } from '../../../../contexts/AppContext'
import { useWallet } from '../../../../wallet'

const ThreadModal = ({ visible, closeModal }) => {
  const { api } = useAragonApi()
  const { loadingBox, loadingSpace, newThread } = use3Box()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [disabled, setDisabled] = useState(false)
  const { account } = useWallet()
  const theme = useTheme()

  useEffect(() => {
    setDisabled(title === '' || description === '')
  }, [title, description])

  const onSubmit = async () => {
    setDisabled(true)
    const now = new Date()
    const name =
      title
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/ /g, '-')
        .toLowerCase() +
      '-' +
      now.getTime()
    const boxResult = await newThread(name)
    const boxAddress = boxResult._address
    const creationDate = now.toString()
    const context = 'forum'
    const author = account
    const metadata = {
      name,
      title,
      description,
      creationDate,
      context,
      author,
    }
    const cId = await ipfsAdd(metadata)
    await api.registerThread(boxAddress, cId).toPromise()
    clearAndClose()
    setDisabled(false)
  }

  const clearAndClose = () => {
    closeModal()
    setTitle('')
    setDescription('')
  }

  return (
    <Modal
      visible={visible}
      closeButton={!loadingSpace}
      onClose={!loadingSpace ? clearAndClose : null}
      padding={0}
    >
      <div
        css={`
          ${textStyle('title3')};
          font-weight: 600;
          padding: ${3 * GU}px;
          border-bottom: 1px solid ${theme.border};
          line-height: 1;
        `}
      >
        {loadingSpace
          ? `Unlocking ${loadingBox ? '3Box' : 'space'}`
          : 'New thread'}
      </div>
      {loadingSpace ? (
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
            Please sign message to unlock {loadingBox ? 'box' : 'space'}...
          </div>
        </div>
      ) : (
        <div
          css={`
            display: flex;
            flex-direction: column;
            padding: ${3 * GU}px;
          `}
        >
          <div
            css={`
              margin-bottom: ${GU}px;
            `}
          >
            <TextInput
              value={title}
              onChange={event => setTitle(event.target.value)}
              placeholder="Title"
              autofocus
              wide
            />
          </div>
          <div>
            <Markdown data={description} setData={setDescription} />
          </div>
          <div
            css={`
              align-self: flex-end;
            `}
          >
            <Button
              onClick={onSubmit}
              disabled={disabled}
              label="Submit"
              mode="strong"
            />
          </div>
        </div>
      )}
    </Modal>
  )
}

ThreadModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  closeModal: PropTypes.func.isRequired,
}

export default ThreadModal

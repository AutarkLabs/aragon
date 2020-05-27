import React from 'react'
import PropTypes from 'prop-types'
import { Button, GU, Modal, textStyle, useTheme } from '@aragon/ui'

const DeleteModal = ({ visible, onClose, onSubmit }) => {
  const theme = useTheme()
  return (
    <Modal visible={visible} onClose={onClose} padding={0}>
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
          Remove reply
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
            Are you sure you want to remove your reply? Once your reply has been
            removed, you won’t be able to recover it.
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
                onClick={onClose}
                css={`
                  color: ${theme.contentSecondary};
                  background: ${theme.border};
                `}
              />
            </div>
            <div>
              <Button label="Remove" onClick={onSubmit} mode="strong" />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}

DeleteModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
}

export default DeleteModal

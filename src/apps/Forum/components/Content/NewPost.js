import React, { useState } from 'react'
import { Button, Card, GU } from '@aragon/ui'
import Markdown from '../Markdown/Markdown'
import { useWallet } from '../../../../wallet'
import { use3Box } from '../../../../hooks'
import LocalIdentityBadge from '../../../../components/IdentityBadge/LocalIdentityBadge'

const NewPost = () => {
  const [description, setDescription] = useState('')
  const { account } = useWallet()
  const { newPost } = use3Box()

  const submitNewPost = async () => {
    await newPost(description)
    setDescription('')
  }

  if (account) {
    return (
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
          `}
        >
          <div
            css={`
              margin-bottom: ${GU}px;
            `}
          >
            <LocalIdentityBadge entity={account} />
          </div>
          <div>
            <Markdown data={description} setData={setDescription} />
          </div>
          <div
            css={`
              display: flex;
              justify-content: flex-end;
            `}
          >
            <div>
              <Button
                label="Submit"
                mode="strong"
                disabled={description.length === 0}
                onClick={submitNewPost}
              />
            </div>
          </div>
        </div>
      </Card>
    )
  }
}

export default NewPost

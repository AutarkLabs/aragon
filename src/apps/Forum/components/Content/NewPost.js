import React, { useEffect, useState } from 'react'
import { Button, Card, GU, textStyle, useTheme } from '@aragon/ui'
import Markdown from '../Markdown/Markdown'
import { useWallet } from '../../../../wallet'
import { use3Box } from '../../../../hooks'

const NewPost = () => {
  const theme = useTheme()
  const [description, setDescription] = useState('')
  const [userProfile, setUserProfile] = useState()
  const { account } = useWallet()
  const { getProfile, newPost } = use3Box()

  useEffect(() => {
    const getUserProfile = async () => {
      setUserProfile(await getProfile(account))
    }
    getUserProfile()
  }, [getProfile, account])

  const submitNewPost = async () => {
    await newPost(description)
    setDescription('')
  }

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
        {userProfile && (
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
                src={userProfile.image}
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
              {userProfile.name}
            </div>
          </div>
        )}
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

export default NewPost

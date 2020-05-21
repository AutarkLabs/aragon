import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import {
  Card,
  GU,
  // IconActivity,
  // IconComment,
  IconTime,
  IconChat,
  LoadingRing,
  textStyle,
} from '@aragon/ui'
import { formatDistance } from 'date-fns'
import { use3Box } from '../../../../hooks'
import { usePathHelpers } from '../../hooks'
import { ProfilePic } from '.'

const ThreadInfo = ({ address, threadDate, threadAuthor }) => {
  const { getAddress, getPosts, getProfile } = use3Box()
  const [postTotal, setPostTotal] = useState('')
  const [postTime, setPostTime] = useState('')
  const [postAuthor, setPostAuthor] = useState()
  const [postAuthorAddress, setPostAuthorAddress] = useState()
  const [postAuthorPic, setPostAuthorPic] = useState()
  const [postLoading, setPostLoading] = useState(true)
  const [picLoading, setPicLoading] = useState(true)
  const [initPost, setInitPost] = useState(false)
  const [initPic, setInitPic] = useState(false)

  const isMounted = { value: false }
  useEffect(() => {
    isMounted.value = true
    return () => {
      isMounted.value = false
    }
  }, [isMounted.value])

  useEffect(() => {
    if (postAuthor && !initPic) {
      setInitPic(true)
      getProfile(postAuthor)
        .then((profile) => {
          const { image, proof_did } = profile
          if (!image) {
            const authorAddress = getAddress(proof_did)
            setPostAuthorAddress(authorAddress)
          } else {
            setPostAuthorPic(image)
          }
          setPicLoading(false)
          return null
        })
        .catch(error => console.error(error))
    }
  }, [postAuthor, initPic, getProfile])

  useEffect(() => {
    if (!initPost) {
      setInitPost(true)
      getPosts(address)
        .then(posts => {
          if (!isMounted.value) return null
          const postCount = posts.filter(
            post => !post.message.includes('originalPostId')
          ).length
          setPostTotal(postCount)
          if (postCount === 0) {
            setPostAuthor(threadAuthor)
            setPostTime(
              formatDistance(threadDate, new Date(), { addSuffix: false })
            )
          } else {
            const { author, timestamp } = posts[postCount - 1]
            setPostAuthor(author)
            setPostTime(
              formatDistance(new Date(timestamp * 1000), new Date(), {
                addSuffix: false,
              })
            )
          }
          setPostLoading(false)
          return null
        })
        .catch(error => console.error(error))
    }
  }, [isMounted.value, address, threadDate, threadAuthor, initPost, getPosts])

  return (
    <div
      css={`
        display: flex;
        align-items: center;
        ${textStyle('body2')};
        line-height: 1.5;
        > span {
          white-space: nowrap;
          margin: 0 ${2 * GU}px 0 ${GU}px;
          font-weight: 600;
        }
      `}
    >
      <IconChat size="medium" />
      <span>{postLoading ? <LoadingRing /> : postTotal}</span>
      <IconTime size="medium" />
      <span>{postLoading ? <LoadingRing /> : `${postTime} ago`}</span>
      <ProfilePic
        imgSrc={postAuthorPic}
        account={postAuthorAddress}
        size={4 * GU}
        loading={picLoading}
      />
    </div>
  )
}

ThreadInfo.propTypes = {
  address: PropTypes.string.isRequired,
  threadDate: PropTypes.instanceOf(Date).isRequired,
  threadAuthor: PropTypes.string.isRequired,
}

const Thread = ({ address, title, name, creationDate, author }) => {
  const { requestPath } = usePathHelpers()

  return (
    <Card
      width="100%"
      height="auto"
      css={`
        margin-bottom: ${GU}px;
      `}
      onClick={() => requestPath(`/threads/${name}`)}
    >
      <div
        css={`
          width: 100%;
          padding: ${3 * GU}px ${5 * GU}px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          @media only screen and (max-width: 600px) {
            flex-direction: column;
            align-items: flex-start;
            padding: ${2 * GU}px;
          }
        `}
      >
        <div
          css={`
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            margin-right: ${2 * GU}px;
            ${textStyle('title4')};
            @media only screen and (max-width: 600px) {
              margin-bottom: ${2 * GU}px;
            }
          `}
        >
          {title}
        </div>
        <ThreadInfo
          address={address}
          threadDate={creationDate}
          threadAuthor={author}
        />
      </div>
    </Card>
  )
}

Thread.propTypes = {
  address: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  creationDate: PropTypes.instanceOf(Date).isRequired,
  author: PropTypes.string.isRequired,
}

export default Thread

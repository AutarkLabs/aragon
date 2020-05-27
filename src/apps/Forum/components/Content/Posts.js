import React from 'react'
import Post from './Post'
import { use3Box } from '../../../../hooks'

const Posts = () => {
  const { activePosts } = use3Box()

  return (
    <div>
      {activePosts.map(post => {
        return <Post key={post.postId} {...post} />
      })}
    </div>
  )
}

export default Posts

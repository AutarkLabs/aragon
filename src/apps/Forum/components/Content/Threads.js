import React from 'react'
import PropTypes from 'prop-types'
import { Thread } from '.'

const Threads = ({ threads }) => {
  return threads.map(
    ({ address, name, title, creationDate, author }, index) => {
      return (
        <Thread
          key={index}
          address={address}
          title={title}
          name={name}
          creationDate={creationDate}
          author={author}
        />
      )
    }
  )
}

Threads.propTypes = {
  threads: PropTypes.array.isRequired,
}

export default Threads

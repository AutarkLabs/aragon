import React, { createContext, useCallback, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { AragonType } from '../prop-types'
import Box from '3box'
import { usePermissionsByRole } from './PermissionsContext'
import { useAppState, useAragonApi } from './AppContext'
import { useWallet } from '../wallet'
import { ipfsDefaultConf } from '../environment'

export const ThreeBoxContext = createContext({})

export const ThreeBoxProvider = ({
  children,
  dao,
  onSignatures,
  web3,
  wrapper,
}) => {
  const permissions = usePermissionsByRole()
  // const { holders } = useAppState('tokens')
  // const { holders } = useAppState()
  const holders = []
  // console.log('appstate', useAppState())
  const {
    api: { currentApp },
  } = useAragonApi('forum')
  const account = useWallet()
  const [loadingBox, setLoadingBox] = useState(false)
  const [loadingSpace, setLoadingSpace] = useState(false)
  const [loadingThread, setLoadingThread] = useState(false)
  const [box, setBox] = useState(null)
  const [space, setSpace] = useState(null)
  const [activeThread, setActiveThread] = useState(null)
  const [activeThreadAddress, setActiveThreadAddress] = useState(null)
  const [activeThreadName, setActiveThreadName] = useState(null)
  const [activePosts, setActivePosts] = useState([])
  const [members, setMembers] = useState([])
  const [memberProofs, setMemberProofs] = useState({})
  const [syncingMembers, setSyncingMembers] = useState(false)
  const [moderators, setModerators] = useState([])

  class Web3ProviderProxy {
    constructor(ethereumAddress, onSignatures, web3Provider, requestingApp) {
      this.ethereumAddress = ethereumAddress
      this.onSignatures = onSignatures
      this.web3Provider = web3Provider
      this.requestingApp = requestingApp
    }

    sendAsync = ({ fromAddress, method, params, jsonrpc }, callback) => {
      const overridenMethods = {
        personal_sign: ([message, address], callback) => {
          if (address.toLowerCase() !== this.ethereumAddress.toLowerCase()) {
            throw new Error('Address mismatch')
          }
          const signatureBag = {
            message,
            requestingApp: this.requestingApp,
            resolve: signature =>
              callback(null, { result: signature, error: null }),
            reject: error => callback(error, { error }),
          }
          return this.onSignatures(signatureBag)
        },
      }

      // if we want to override a default web3 behavior (like personal_sign), we return the overriden method here
      if (overridenMethods[method]) {
        return overridenMethods[method](params, callback)
      }
      return this.web3Provider.sendAsync(
        {
          fromAddress,
          method,
          params,
          jsonrpc,
        },
        callback
      )
    }
  }

  const getProfile = useCallback(async identifier => {
    const profile = await Box.getProfile(identifier)
    const { image } = profile
    if (image) {
      const imageIPFS = image[0]['contentUrl']['/']
      const imageLink = `${ipfsDefaultConf.gateway}/${imageIPFS}`
      profile.image = imageLink
    }
    return profile
  }, [])

  const getPosts = useCallback(
    async threadAddress => {
      if (space) {
        const thread = await space.joinThreadByAddress(threadAddress)
        const posts = await thread.getPosts()
        return posts
      }
      const posts = await Box.getThreadByAddress(threadAddress)
      return posts
    },
    [space]
  )

  const isCurrentUser = useCallback(
    async did => {
      if (!box) return false
      const profile = await getProfile(did)
      const currentProfile = await getProfile(box.DID)
      return profile.proof_did === currentProfile.proof_did
    },
    [box, getProfile]
  )

  // const userCanPost = useCallback(() => {
  //   return members.includes(account.account)
  // }, [account, members])

  const userCanPost = true

  const connect3Box = useCallback(async () => {
    const web3ProviderProxy = new Web3ProviderProxy(
      account.account,
      onSignatures,
      web3,
      dao
    )
    try {
      setLoadingBox(true)
      setLoadingSpace(true)
      const newBox = await Box.openBox(account.account, web3ProviderProxy)
      setBox(newBox)
      setLoadingBox(false)
      const newSpace = await newBox.openSpace(dao)
      setSpace(newSpace)
      setLoadingSpace(false)
      return newSpace
    } catch (error) {
      console.error(error)
      setLoadingBox(false)
      setLoadingSpace(false)
      return null
    }
  }, [
    Web3ProviderProxy,
    account.account,
    dao,
    onSignatures,
    web3,
    setLoadingBox,
    setLoadingSpace,
    setSpace,
  ])

  const resolveSpace = useCallback(async () => {
    let thisSpace
    if (!space) {
      thisSpace = await connect3Box()
    } else {
      thisSpace = space
    }
    return thisSpace
  }, [space, connect3Box])

  const processPosts = useCallback(
    async posts => {
      const visiblePosts = {}
      posts.forEach(post => {
        if (post.message.includes('originalPostId')) {
          try {
            const editObject = JSON.parse(post.message)
            if (editObject.originalPostId && editObject.newMessage) {
              const originalPost = posts.find(
                post => post.postId === editObject.originalPostId
              )
              if (originalPost && post.author === originalPost.author) {
                visiblePosts[editObject.originalPostId] = editObject.newMessage
              }
            }
          } catch (error) {}
        } else {
          visiblePosts[post.postId] = post.message
        }
      })

      const filteredPosts = posts.filter(post => post.postId in visiblePosts)
      return (
        await Promise.all(
          filteredPosts.map(async post => {
            const profile = await getProfile(post.author)
            post.message = visiblePosts[post.postId]
            post.name = profile.name
            post.image = profile.image
            post.isCurrentUser = await isCurrentUser(profile)
            post.creationDate = new Date(post.timestamp * 1000)
            post.proof_did = profile.proof_did
            return post
          })
        )
      ).filter(post => {
        return Object.values(memberProofs).includes(post.proof_did)
      })
    },
    [getProfile, isCurrentUser, memberProofs]
  )

  const updatePosts = useCallback(
    async thread => {
      const posts = await thread.getPosts()
      const processedPosts = await processPosts(posts)
      setActivePosts(processedPosts)
    },
    [processPosts, setActivePosts]
  )

  const setThreadAndWatch = useCallback(
    async thread => {
      setActiveThread(thread)
      updatePosts(thread)
      thread.onUpdate(() => updatePosts(thread))
      return true
    },
    [setActiveThread, updatePosts]
  )

  const newThread = useCallback(
    async threadName => {
      setLoadingThread(true)
      const thisSpace = await resolveSpace()
      if (thisSpace) {
        const thread = thisSpace.joinThread(threadName, {
          firstModerator: moderators[0],
          members: false,
        })
        setLoadingThread(false)
        return thread
      } else {
        setLoadingThread(false)
        return null
      }
    },
    [moderators, resolveSpace, setLoadingThread]
  )

  const newPost = useCallback(
    async message => {
      if (activeThreadAddress || activeThreadName) {
        let thisThread
        if (!activeThread) {
          const thisSpace = await resolveSpace()
          if (thisSpace) {
            if (activeThreadAddress) {
              thisThread = await thisSpace.joinThreadByAddress(
                activeThreadAddress
              )
            } else {
              const firstModerator = await getProfile(moderators[0])
              thisThread = await thisSpace.joinThread(activeThreadName, {
                firstModerator: firstModerator.ethereum_proof.linked_did,
                members: false,
              })
            }
            setThreadAndWatch(thisThread)
          }
        } else {
          thisThread = activeThread
        }
        await thisThread.post(message)
        return true
      } else {
        console.error('Active thread not set!')
        return false
      }
    },
    [
      activeThread,
      activeThreadAddress,
      activeThreadName,
      getProfile,
      moderators,
      resolveSpace,
      setThreadAndWatch,
    ]
  )

  const deletePost = useCallback(
    async id => {
      if (activeThreadAddress || activeThreadName) {
        let thisThread
        if (!activeThread) {
          const thisSpace = await resolveSpace()
          if (thisSpace) {
            if (activeThreadAddress) {
              thisThread = await thisSpace.joinThreadByAddress(
                activeThreadAddress
              )
            } else {
              const firstModerator = await getProfile(moderators[0])
              thisThread = await thisSpace.joinThread(activeThreadName, {
                firstModerator: firstModerator.ethereum_proof.linked_did,
                members: false,
              })
            }
            setThreadAndWatch(thisThread)
          }
        } else {
          thisThread = activeThread
        }
        await thisThread.deletePost(id)
        return true
      } else {
        console.error('Active thread not set!')
        return false
      }
    },
    [
      activeThread,
      activeThreadAddress,
      activeThreadName,
      getProfile,
      moderators,
      resolveSpace,
      setThreadAndWatch,
    ]
  )

  const activateThread = useCallback(
    async threadId => {
      setLoadingThread(true)
      if (threadId.includes('/orbitdb/')) {
        setActiveThreadAddress(threadId)
      } else {
        setActiveThreadName(threadId)
      }
    },
    [setActiveThreadAddress, setActiveThreadName]
  )

  const deactivateThread = useCallback(() => {
    setActiveThread(null)
    setActiveThreadAddress(null)
    setActiveThreadName(null)
    setActivePosts([])
  }, [setActiveThread, setActiveThreadAddress, setActivePosts])

  // Update space when account changes
  /*
  // NOTE: This behaviour needs to be reassesed. The flow of signing two
  // messages immediately when you connect your account is bad UX.
  useEffect(() => {
    async function connectBox() {
      const web3ProviderProxy = new Web3ProviderProxy(
        account.account,
        onSignatures,
        web3,
        dao
      )
      const newBox = await Box.openBox(account.account, web3ProviderProxy)
      setBox(newBox)
      const newSpace = await newBox.openSpace(dao)
      setSpace(newSpace)
    }

    if( account.isConnected ) connectBox()
  }, [ account, dao, web3 ])
  */

  // Reset state when wrapper changes
  useEffect(() => {
    if (!wrapper) {
      setBox(null)
      setSpace(null)
      setActiveThread(null)
      setActiveThreadAddress(null)
      setActiveThreadName(null)
      setActivePosts([])
    }
  }, [wrapper])

  // Reset 3Box if the account changes
  useEffect(() => {
    setBox(null)
    setSpace(null)
    setActiveThread(null)
  }, [account])

  useEffect(() => {
    const setThread = async () => {
      setLoadingThread(true)
      const thread = await space.joinThreadByAddress(activeThreadAddress)
      await setThreadAndWatch(thread)
      setLoadingThread(false)
    }
    if (
      !syncingMembers &&
      space &&
      activeThreadAddress &&
      activeThreadAddress !== (activeThread && activeThread._address) &&
      Object.keys(memberProofs).length
    ) {
      setThread()
    }
  }, [
    activeThread,
    activeThreadAddress,
    members,
    memberProofs,
    resolveSpace,
    setLoadingThread,
    space,
    syncingMembers,
    setThreadAndWatch,
  ])

  useEffect(() => {
    const setThread = async () => {
      setLoadingThread(true)
      const firstModerator = await getProfile(moderators[0])
      const thread = await space.joinThread(activeThreadName, {
        firstModerator: firstModerator.ethereum_proof.linked_did,
        members: false,
      })
      await setThreadAndWatch(thread)
      setLoadingThread(false)
    }
    if (
      !syncingMembers &&
      space &&
      activeThreadName &&
      !activeThreadAddress &&
      activeThreadName !==
        (activeThread &&
          activeThread._name.replace(
            `3box.thread.${activeThread._spaceName}.`,
            ''
          )) &&
      Object.keys(memberProofs).length
    ) {
      setThread()
    }
  }, [
    activeThread,
    activeThreadName,
    members,
    memberProofs,
    moderators,
    setLoadingThread,
    space,
    syncingMembers,
    activeThreadAddress,
    setThreadAndWatch,
    getProfile,
  ])

  useEffect(() => {
    if ((activeThreadAddress || activeThreadName) && !space && !loadingSpace) {
      resolveSpace()
    }
  }, [activeThreadAddress, activeThreadName, space, loadingSpace, resolveSpace])

  useEffect(() => {
    if (holders) {
      const memberAddresses = holders.map(holder => holder.address)
      if (memberAddresses.sort().join(',') !== members.sort().join(',')) {
        setMembers(memberAddresses)
      }
    }
  }, [holders, members])

  useEffect(() => {
    const lookupModerators = async () => {
      const forumApp = await currentApp().toPromise()
      if (forumApp) {
        const forumAddress = forumApp.appAddress
        const moderatorRole = forumAddress
          ? permissions.find(
              permission =>
                permission.app &&
                permission.app.proxyAddress === forumAddress &&
                permission.role.id === 'MODERATOR_ROLE'
            )
          : null
        setModerators(
          moderatorRole
            ? moderatorRole.entities.map(entity => entity.address)
            : []
        )
      }
    }
    if (!moderators.length) lookupModerators()
  }, [currentApp, permissions, moderators, setModerators])

  useEffect(() => {
    const getProofs = async () => {
      const proofs = { ...memberProofs }
      await Promise.all(
        members.map(async member => {
          if (!memberProofs[member]) {
            const profile = await getProfile(member)
            proofs[member] = profile.proof_did
          }
        })
      )
      setMemberProofs(proofs)
      setSyncingMembers(false)
    }
    if (
      !syncingMembers &&
      members &&
      members.sort().join(',') !==
        Object.keys(memberProofs)
          .sort()
          .join(',')
    ) {
      setSyncingMembers(true)
      getProofs()
    }
  }, [members, memberProofs, getProfile, syncingMembers])

  return (
    <ThreeBoxContext.Provider
      value={{
        activateThread,
        activeThread,
        activeThreadAddress,
        activePosts,
        connect3Box,
        deactivateThread,
        deletePost,
        getPosts,
        getProfile,
        isCurrentUser,
        loadingBox,
        loadingSpace,
        loadingThread,
        newThread,
        newPost,
        userCanPost,
      }}
    >
      {children}
    </ThreeBoxContext.Provider>
  )
}

ThreeBoxProvider.propTypes = {
  children: PropTypes.node.isRequired,
  dao: PropTypes.string.isRequired,
  onSignatures: PropTypes.func.isRequired,
  web3: PropTypes.object.isRequired,
  wrapper: AragonType,
}

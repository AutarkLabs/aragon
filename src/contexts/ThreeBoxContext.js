import React, { createContext, useCallback, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { AragonType } from '../prop-types'
import Box from '3box'
import { usePermissionsByRole } from './PermissionsContext'
import { useWallet } from '../wallet'
import { appIds, ipfsDefaultConf } from '../environment'

const getCacheKey = (address, location) => {
  return `${address}.${location}`
}

export const ThreeBoxContext = createContext({})

export const ThreeBoxProvider = ({
  apps,
  children,
  dao,
  onSignatures,
  web3,
  wrapper,
}) => {
  const permissions = usePermissionsByRole()
  const account = useWallet()
  const [installedApps, setInstalledApps] = useState(apps)
  const [loadingBox, setLoadingBox] = useState(false)
  const [loadingSpace, setLoadingSpace] = useState(false)
  const [loadingThread, setLoadingThread] = useState(false)
  const [box, setBox] = useState(null)
  const [space, setSpace] = useState(null)
  const [activeAccount, setActiveAccount] = useState(account.account)
  const [activeThread, setActiveThread] = useState(null)
  const [activeThreadAddress, setActiveThreadAddress] = useState(null)
  const [activeThreadName, setActiveThreadName] = useState(null)
  const [activePosts, setActivePosts] = useState([])
  const [members, setMembers] = useState([])
  const [memberProofs, setMemberProofs] = useState({})
  const [memberLookups, setMemberLookups] = useState({})
  const [syncingMembers, setSyncingMembers] = useState(false)
  const [moderators, setModerators] = useState(null)
  const [discussions, setDiscussions] = useState(null)
  const [tokens, setTokens] = useState(null)

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

  const getAddress = useCallback(
    identifier => {
      return memberLookups[identifier]
    },
    [memberLookups]
  )

  const getProfile = useCallback(async identifier => {
    const profile = await Box.getProfile(identifier)
    if (profile.proof_did) profile.proofDid = profile.proof_did // Linter requires camel case
    if (profile.image) {
      const imageIPFS = profile.image[0]['contentUrl']['/']
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
      return profile.proofDid === currentProfile.proofDid
    },
    [box, getProfile]
  )

  const userCanPost = useCallback(() => {
    return members.includes(account.account)
  }, [account, members])

  const connect3Box = useCallback(async () => {
    const web3ProviderProxy = new Web3ProviderProxy(
      account.account,
      onSignatures,
      web3,
      dao
    )
    if (!account.account) account.enable()
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
  }, [Web3ProviderProxy, account, onSignatures, web3, dao])

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
            post.account = memberLookups[profile.proofDid]
            post.isCurrentUser = await isCurrentUser(profile)
            post.creationDate = new Date(post.timestamp * 1000)
            post.proofDid = profile.proofDid
            return post
          })
        )
      ).filter(post => {
        return Object.values(memberProofs).includes(post.proofDid)
      })
    },
    [getProfile, isCurrentUser, memberLookups, memberProofs]
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
    if (account.account !== activeAccount) {
      setActiveAccount(account.account)
      setBox(null)
      setSpace(null)
      setActiveThread(null)
    }
  }, [account, activeAccount])

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
    if (apps.length > installedApps.length) setInstalledApps(apps)
  }, [apps, installedApps, setInstalledApps])

  useEffect(() => {
    const discussionsApp = installedApps.find(
      app => app.appId && app.appId === appIds.Discussions
    )
    if (discussionsApp) setDiscussions(discussionsApp)
    const tokensApp = installedApps.find(
      app => app.appId && app.appId === appIds.TokenManager
    )
    if (tokensApp) setTokens(tokensApp)
  }, [installedApps])

  useEffect(() => {
    const getMembers = async () => {
      const state = await wrapper.cache.get(
        getCacheKey(tokens.proxyAddress, 'state')
      )
      const { holders } = state
      if (holders) {
        const memberAddresses = holders.map(holder => holder.address)
        if (memberAddresses.sort().join(',') !== members.sort().join(',')) {
          setMembers(memberAddresses)
        }
      }
    }
    if (tokens) getMembers()
  }, [tokens, members, wrapper])

  useEffect(() => {
    const lookupModerators = async () => {
      if (discussions) {
        const discussionsAddress = discussions.proxyAddress
        const moderatorRole = discussionsAddress
          ? permissions.find(
              permission =>
                permission.app &&
                permission.app.proxyAddress === discussionsAddress &&
                permission.role.id === 'MODERATOR_ROLE'
            )
          : null
        if (moderatorRole) {
          setModerators(moderatorRole.entities.map(entity => entity.address))
        }
      }
    }
    if (!moderators) lookupModerators()
  }, [discussions, permissions, moderators, setModerators])

  useEffect(() => {
    const getProofs = async () => {
      const proofs = { ...memberProofs }
      const lookups = { ...memberLookups }
      await Promise.all(
        members.map(async member => {
          if (!memberProofs[member]) {
            const profile = await getProfile(member)
            proofs[member] = profile.proofDid
            lookups[profile.proofDid] = member
          }
        })
      )
      setMemberProofs({ ...proofs })
      setMemberLookups({ ...lookups })
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
  }, [members, memberProofs, memberLookups, getProfile, syncingMembers])

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
        getAddress,
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
  apps: PropTypes.array.isRequired,
  children: PropTypes.node.isRequired,
  dao: PropTypes.string.isRequired,
  onSignatures: PropTypes.func.isRequired,
  web3: PropTypes.object.isRequired,
  wrapper: AragonType,
}

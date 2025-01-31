import React, { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import { useSelector, useDispatch } from 'react-redux'
import EnvironmentBadge from './EnvironmentBadge'
import MenuBarItem from './MenuBarItem'
import SignInButton from './SignInButton'
import AvatarMenu from './AvatarMenu'
import { doSignIn } from '../users/authentication'
import { showDialog } from '../store/slices/dialogs'
import logo from '../../images/logo_horizontal_fvv.svg'
import './MenuBar.scss'

import { API_URL } from '../app/config'
import USER_ROLES from '../../../app/data/user_roles'
const axios = require('axios')
let missingMetadataShowed = false

MenuBar.propTypes = {
  onMenuDropdownClick: PropTypes.func.isRequired
}

function MenuBar (props) {
  const user = useSelector((state) => state.user.signInData?.details || null)
  const streetId = useSelector((state) => state.street.id)
  const offline = useSelector((state) => state.system.offline)
  const upgradeFunnel = useSelector(
    (state) => state.flags.BUSINESS_PLAN.value || false
  )
  const dispatch = useDispatch()
  const menuBarRightEl = useRef(null)

  let roles = []
  let isAdmin = false
  let isUser = false
  if (user) {
    // user available
    roles = user.roles
    isAdmin = roles.includes(USER_ROLES.ADMIN.value)
    isUser = roles.includes(USER_ROLES.USER.value)
  }

  useEffect(() => {
    window.addEventListener('resize', handleWindowResize)

    // StreetNameplateContainer needs to know the left position of the right
    // menu bar when it's mounted
    window.addEventListener('stmx:streetnameplate_mounted', handleWindowResize)

    // Clean up event listeners
    return () => {
      window.removeEventListener('resize', handleWindowResize)
      window.removeEventListener(
        'stmx:streetnameplate_mounted',
        handleWindowResize
      )
    }
  })

  /**
   * Handles clicks on <button> elements which result in a dropdown menu.
   * Pass in the name of this menu, and it returns (curries) a function
   * that handles the event.
   */
  function handleClickMenuButton (menu) {
    return (event) => {
      const el = event.target.closest('button')
      props.onMenuDropdownClick(menu, el)
    }
  }

  function handleClickUpgrade (event) {
    event.preventDefault()
    dispatch(showDialog('UPGRADE'))
  }

  function handleWindowResize () {
    // Throw this event so that the StreetName can figure out if it needs
    // to push itself lower than the menubar
    window.dispatchEvent(
      new CustomEvent('stmx:menu_bar_resized', {
        detail: {
          rightMenuBarLeftPos: menuBarRightEl.current.getBoundingClientRect()
            .left
        }
      })
    )
  }

  async function getch (id, method, endpoint, body) {
    const apiUri = API_URL + 'v1'
    let response

    try {
      if (method === 'POST') {
        if (id === '') {
          response = await axios.post(`${apiUri}/${endpoint}`, body)
        } else {
          response = await axios.put(`${apiUri}/${endpoint}/${id}`, body)
        }
      } else {
        if (id !== '') {
          response = await axios.get(`${apiUri}/${endpoint}/${id}`)
        } else {
          response = await axios.get(`${apiUri}/${endpoint}`)
        }
      }
    } catch (error) {
      console.log(error)
      return ''
    }
    return response.data
  }

  // show missing metadata dialog if user is logged in, metadata is missing and user has not received the notification before
  if (streetId && user) {
    getch(streetId, 'GET', 'streetExtension').then((response) => {
      if (!response && !missingMetadataShowed) {
        missingMetadataShowed = true
        dispatch(showDialog('METADATA_MISSING'))
      }
    })
  }

  function renderUserAvatar (user) {
    return user ? (
      <li>
        <AvatarMenu user={user} onClick={handleClickMenuButton('identity')} />
      </li>
    ) : (
      <li>
        <SignInButton onClick={doSignIn} />
      </li>
    )
  }

  return (
    <nav className="menu-bar">
      <ul className="menu-bar-left">
        <li className="menu-bar-title">
          <img src={logo} alt="Streemix" className="menu-bar-logo" />
          <h1>Streetmix - @FVV-TU-Vienna</h1>
        </li>
        {/* Admin overview */}
        {isAdmin && (
          <>
            <MenuBarItem
              label="Admin"
              translation="menu.item.admin"
              url="#"
              onClick={() => dispatch(showDialog('ADMIN'))}
            />

            <MenuBarItem
              label="AdminMap"
              translation="menu.item.adminMap"
              url="#"
              onClick={() => dispatch(showDialog('ADMIN_MAP'))}
            />
          </>
        )}
        <MenuBarItem
          label="Help"
          translation="menu.item.help"
          onClick={handleClickMenuButton('help')}
        />
        {!offline && (
          <>
            <MenuBarItem
              label="Contact"
              translation="menu.item.contact"
              onClick={handleClickMenuButton('contact')}
            />
            {upgradeFunnel ? (
              <MenuBarItem
                url="#"
                label="Upgrade"
                translation="menu.upgrade"
                onClick={handleClickUpgrade}
              />
            ) : (
              /*
              <MenuBarItem
                label="Donate"
                translation="menu.contribute.donate"
                url="https://opencollective.com/streetmix/"
              />
              */
              <></>
            )}

            {/*
            <MenuBarItem
              label="Store"
              translation="menu.item.store"
              url="https://cottonbureau.com/people/streetmix"
            />
            */}
          </>
        )}
      </ul>
      <ul className="menu-bar-right" ref={menuBarRightEl}>
        <MenuBarItem
          label="New street"
          translation="menu.item.new-street"
          url="/new"
          target="_blank"
        />
        <MenuBarItem
          label="Settings"
          translation="menu.item.settings"
          onClick={handleClickMenuButton('settings')}
        />

        {/* additional menu item for submitting current streetmix */}
        {isUser && (
          <MenuBarItem
            label="Metadata"
            translation="menu.item.metadata"
            url="#"
            onClick={() => dispatch(showDialog('METADATA'))}
          />
        )}

        <MenuBarItem
          label="Share"
          translation="menu.item.share"
          onClick={handleClickMenuButton('share')}
        />
        {!offline && renderUserAvatar(user)}
      </ul>
      <EnvironmentBadge />
    </nav>
  )
}

export default MenuBar

import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

// Import all dialogs here
import AboutDialog from './AboutDialog'
import AnalyticsDialog from './AnalyticsDialog'
import FeatureFlagDialog from './FeatureFlagDialog'
import GeotagDialog from './GeotagDialog'
import SaveAsImageDialog from './SaveAsImageDialog'
import SignInDialog from './SignInDialog'
import WhatsNewDialog from './WhatsNewDialog'
import NewsletterDialog from './NewsletterDialog'
import UpgradeDialog from './UpgradeDialog'
import SentimentSurveyDialog from './SentimentSurveyDialog'
import ErrorDialog from './ErrorDialog'

import MetadataDialog from './MetadataDialog'
import AdminDialog from './AdminDialog'
import MetadataMissingDialog from './MetaDataMissingDialog'
import AdminMapDialog from './AdminMapDialog'

const DIALOG_COMPONENTS = {
  ABOUT: {
    id: AboutDialog
  },
  ANALYTICS: {
    id: AnalyticsDialog
  },
  FEATURE_FLAGS: {
    id: FeatureFlagDialog
  },
  GEOTAG: {
    id: GeotagDialog
  },
  SAVE_AS_IMAGE: {
    id: SaveAsImageDialog
  },
  SIGN_IN: {
    id: SignInDialog
  },
  WHATS_NEW: {
    id: WhatsNewDialog
  },
  NEWSLETTER: {
    id: NewsletterDialog
  },
  UPGRADE: {
    id: UpgradeDialog
  },
  SENTIMENT_SURVEY: {
    id: SentimentSurveyDialog
  },
  METADATA: {
    id: MetadataDialog
  },
  ADMIN: {
    id: AdminDialog
  },
  METADATA_MISSING: {
    id: MetadataMissingDialog
  },
  ADMIN_MAP: {
    id: AdminMapDialog
  }
}

class DialogRoot extends Component {
  static propTypes = {
    name: PropTypes.string
  }

  state = {
    error: false
  }

  static getDerivedStateFromError () {
    return {
      error: true
    }
  }

  resetError = () => {
    this.setState({
      error: false
    })
  }

  render () {
    const { name } = this.props

    // Bail if no dialog name is provided
    if (!name) return null

    // If there is an error, display the error dialog and
    // give it a function to reset state when it closes
    if (this.state.error) return <ErrorDialog reset={this.resetError} />

    // Get the dialog we want, then render it
    try {
      const { id: Dialog } = DIALOG_COMPONENTS[name]
      return <Dialog />
    } catch (err) {
      // Render the error dialog if we are unable to find the dialog
      console.error('[DialogRoot]', `Unable to find dialog id \`${name}\``)
      return <ErrorDialog reset={this.resetError} />
    }
  }
}

export default connect((state) => state.dialogs)(DialogRoot)

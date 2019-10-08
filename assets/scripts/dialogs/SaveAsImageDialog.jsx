/**
 * Save as Image (dialog box)
 *
 * Handles interaction on the "Save as image" dialog box.
 *
 */
import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { FormattedMessage, injectIntl } from 'react-intl'
import Dialog from './Dialog'
import Checkbox from '../ui/Checkbox'
import { trackEvent } from '../app/event_tracking'
import Terms from '../app/Terms'
import { getStreetImage } from '../streets/image'
import { setSettings } from '../store/actions/settings'
import { normalizeSlug } from '../util/helpers'
import './SaveAsImageDialog.scss'

// Require save-as polyfills
import { saveAs } from 'file-saver'

// Verify how this lines up with 150dpi, 300dpi, 600dpi, etc.
const DEFAULT_IMAGE_DPI = 2
const MAX_IMAGE_DPI = 10

class SaveAsImageDialog extends React.Component {
  static propTypes = {
    intl: PropTypes.object.isRequired,
    locale: PropTypes.string,
    transparentSky: PropTypes.bool.isRequired,
    segmentNames: PropTypes.bool.isRequired,
    streetName: PropTypes.bool.isRequired,
    watermark: PropTypes.bool.isRequired,
    street: PropTypes.object.isRequired,
    name: PropTypes.string,
    allowCustomDpi: PropTypes.bool,
    allowControlWatermark: PropTypes.bool,
    setSettings: PropTypes.func
  }

  constructor (props) {
    super(props)

    this.state = {
      dpi: DEFAULT_IMAGE_DPI,
      dpiInputValue: DEFAULT_IMAGE_DPI,
      isLoading: false,
      isShowingPreview: false,
      errorMessage: null,
      download: {
        filename: '',
        dataUrl: ''
      }
    }
  }

  componentDidMount () {
    trackEvent('Sharing', 'Save as image', null, null, false)

    this.updatePreview()
  }

  componentDidUpdate (prevProps, prevState) {
    if (this.state.isLoading === true) {
      // Update preview when props change; make a slight delay because there is
      // a slight lag on image creation, but it's so short it feels weird.
      // Time delay makes the "Loading" feel "right."
      window.setTimeout(() => {
        this.updatePreview()
      }, 100)
    }
  }

  // When options change, this changes props.
  handleChangeOptionTransparentSky = (event) => {
    this.props.setSettings({ saveAsImageTransparentSky: event.target.checked })
    this.setState({ isLoading: true })
  }

  handleChangeOptionSegmentNames = (event) => {
    this.props.setSettings({ saveAsImageSegmentNamesAndWidths: event.target.checked })
    this.setState({ isLoading: true })
  }

  handleChangeOptionStreetName = (event) => {
    this.props.setSettings({ saveAsImageStreetName: event.target.checked })
    this.setState({ isLoading: true })
  }

  handleChangeOptionWatermark = (event) => {
    this.props.setSettings({ saveAsImageWatermark: event.target.checked })
    this.setState({ isLoading: true })
  }

  handlePreviewLoaded = () => {
    this.setState({ isLoading: false })
  }

  handlePreviewError = () => {
    this.setState({
      isLoading: false,
      errorMessage: this.props.intl.formatMessage({
        id: 'dialogs.save.error-preview',
        defaultMessage: 'There was an error displaying a preview image.'
      })
    })
  }

  /**
   * When download links are clicked, convert the dataURL to a blob for download.
   * Designed to get around a limitation in IE where a dataURL is not downloadable
   * directly (https://msdn.microsoft.com/en-us/library/cc848897(v=vs.85).aspx)
   */
  handleClickDownloadImage = (event) => {
    event.preventDefault()
    this.imageCanvas.toBlob((blob) => {
      const filename = this.makeFilename()
      saveAs(blob, filename)
    })
  }

  handleChangeDpiInput = (event) => {
    const value = event.target.value
    const validDpi = Math.min(Math.max(DEFAULT_IMAGE_DPI, Number.parseInt(value, 10)), MAX_IMAGE_DPI) || DEFAULT_IMAGE_DPI

    this.setState({
      isLoading: (validDpi !== this.state.dpi),
      dpiInputValue: value,
      dpi: validDpi
    })
  }

  updatePreview = () => {
    this.imageCanvas = getStreetImage(this.props.street, this.props.transparentSky, this.props.segmentNames, this.props.streetName, this.state.dpi, this.props.watermark)

    // .toDataURL is not available on IE11 when SVGs are part of the canvas.
    // The error in catch() should not appear on any of the newer evergreen browsers.
    try {
      const dataUrl = this.imageCanvas.toDataURL('image/png')
      this.setState({
        download: {
          filename: this.makeFilename(),
          dataUrl: dataUrl
        },
        errorMessage: null
      })
    } catch (e) {
      this.setState({
        errorMessage: this.props.intl.formatMessage({
          id: 'dialogs.save.error-unavailable',
          defaultMessage: 'Saving to image is not available on this browser.'
        })
      })
    }
  }

  makeFilename = () => {
    let filename = normalizeSlug(this.props.name)
    if (!filename) {
      filename = 'street'
    }
    filename += '.png'

    return filename
  }

  render () {
    return (
      <Dialog>
        {() => (
          <div className="save-as-image-dialog">
            <header>
              <h1>
                <FormattedMessage id="dialogs.save.heading" defaultMessage="Save as image" />
              </h1>
            </header>
            <div className="dialog-content">
              <div className="save-as-image-options">
                <Checkbox
                  onChange={this.handleChangeOptionSegmentNames}
                  checked={this.props.segmentNames}
                >
                  <FormattedMessage id="dialogs.save.option-labels" defaultMessage="Segment names and widths" />
                </Checkbox>

                <Checkbox
                  onChange={this.handleChangeOptionStreetName}
                  checked={this.props.streetName}
                >
                  <FormattedMessage id="dialogs.save.option-name" defaultMessage="Street name" />
                </Checkbox>

                <Checkbox
                  onChange={this.handleChangeOptionTransparentSky}
                  checked={this.props.transparentSky}
                >
                  <FormattedMessage id="dialogs.save.option-sky" defaultMessage="Transparent sky" />
                </Checkbox>

                <Checkbox
                  onChange={this.handleChangeOptionWatermark}
                  checked={this.props.watermark}
                  disabled={!this.props.allowControlWatermark}
                >
                  <FormattedMessage id="dialogs.save.option-watermark" defaultMessage="Watermark" />
                </Checkbox>
              </div>
              {
                this.props.allowCustomDpi &&
                  <div className="save-as-image-options">
                    <label htmlFor="save-as-image-dpi-input">Custom DPI (min 2x, max 10x): </label>
                    <input
                      id="save-as-image-dpi-input"
                      type="text"
                      value={this.state.dpiInputValue}
                      onChange={this.handleChangeDpiInput}
                    />
                  </div>
              }
              <div className="save-as-image-preview">
                {!this.state.errorMessage && (
                  <div className="save-as-image-preview-image">
                    <div className="save-as-image-preview-loading" style={{ display: !this.state.isLoading && 'none' }}>
                      <FormattedMessage id="dialogs.save.loading" defaultMessage="Loading…" />
                    </div>
                    <img
                      src={this.state.download.dataUrl}
                      onLoad={this.handlePreviewLoaded}
                      onError={this.handlePreviewError}
                      alt={this.props.intl.formatMessage({
                        id: 'dialogs.save.preview-image-alt',
                        defaultMessage: 'Preview'
                      })}
                    />
                  </div>
                )}
                {this.state.errorMessage && (
                  <div className="save-as-image-preview-error">
                    {this.state.errorMessage}
                  </div>
                )}
              </div>
              <div className="save-as-image-download">
                {!this.state.errorMessage ? (
                  <a
                    className="button-like"
                    onClick={this.handleClickDownloadImage}
                    // Sets the anchor's `download` attribute so that it saves a meaningful filename
                    // Note that this property is not supported in Safari/iOS
                    download={this.state.download.filename}
                    // Link should refer to data URL, even though onClickDownloadImage() is used for direct download
                    href={this.state.download.dataUrl}
                  >
                    <FormattedMessage id="dialogs.save.save-button" defaultMessage="Save to your computer…" />
                  </a>
                ) : (
                  <button disabled>
                    <FormattedMessage id="dialogs.save.save-button" defaultMessage="Save to your computer…" />
                  </button>
                )}
              </div>
            </div>
            <footer>
              <Terms locale={this.props.locale} />
            </footer>
          </div>
        )}
      </Dialog>
    )
  }
}

function mapStateToProps (state) {
  return {
    locale: state.locale.locale,
    transparentSky: state.settings.saveAsImageTransparentSky,
    segmentNames: state.settings.saveAsImageSegmentNamesAndWidths,
    streetName: state.settings.saveAsImageStreetName,
    // Even if watermarks are off, override with flag value if EXPORT_WATERMARK is `false`.
    watermark: state.settings.saveAsImageWatermark || !state.flags.EXPORT_WATERMARK.value,
    street: state.street,
    name: state.street.name,
    allowCustomDpi: state.flags.SAVE_AS_IMAGE_CUSTOM_DPI.value,
    allowControlWatermark: state.flags.EXPORT_WATERMARK.value
  }
}

const mapDispatchToProps = { setSettings }

export default connect(mapStateToProps, mapDispatchToProps)(injectIntl(SaveAsImageDialog))

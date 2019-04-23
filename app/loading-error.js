// Global error handling during app initialization
// Use ancient JavaScript to be able to show errors on ancient browsers

(function () {
  // Do some basic feature detection to reject old browsers
  var supportedBrowser = hasFetch() && hasFlexbox() && hasES6()
  if (!supportedBrowser) {
    showUnsupportedBrowserError()
  }
  // Expose for later use
  ;/** @type {any} */(window).supportedBrowser = supportedBrowser

  // Use window.onerror to catch errors while executing scripts
  // during initialization
  window.onerror = function () {
    showLoadingError()
  }

  // Expose showLoadingError to be used in script tags
  ;/** @type {any} */ (window).showLoadingError = showLoadingError

  /**
   * @param {string} message
   */
  function showFatalError (message) {
    var container = document.getElementById('loading-error')
    if (container) {
      var messageElement = container.getElementsByTagName('div')[0]
      messageElement.innerHTML = message
      container.style.display = 'block'
    }
  }

  function showUnsupportedBrowserError () {
    showFatalError(
      '<p>Your browser does not support some features required by this application.</p>' +
      '<p>Please use a recent version of Google Chrome, Mozilla Firefox, Microsoft Edge or Safari.</p>' +
      '<p><a href="https://browsehappy.com/">Download a modern browser</a></p>'
    )
  }

  function showLoadingError () {
    // Don't bother showing anything else if the browser is unsupported
    if (!supportedBrowser) return
    showFatalError(
      '<p>Something went wrong while loading the application.</p>' +
      '<p>Please check your network connection and <a href="#" onclick="location.reload()">try reloading</a>.</p>' +
      '<p><small>If reloading does not help try to <a href="#" onclick="resetStorage()">reset</a> the application.</small></p>'
    )
  }

  ;/** @type {any} */ (window).resetStorage = function resetStorage () {
    localStorage.clear()
    location.reload()
  }

  // Source: https://gist.github.com/davidhund/b995353fdf9ce387b8a2#gistcomment-2200441
  function hasFlexbox () {
    var f = 'flex'
    var fw = '-webkit-flex'
    var el = document.createElement('b')

    try {
      el.style.display = fw
      el.style.display = f
      return !!(el.style.display === f || el.style.display === fw)
    } catch (err) {
      return false
    }
  }

  function hasFetch () {
    return 'fetch' in window
  }

  function hasES6 () {
    return typeof Symbol !== 'undefined'
  }
})()

/* global FontFaceObserver */
/// <reference path="./main.d.ts" />

import '/node_modules/fontfaceobserver/fontfaceobserver.standalone.js'
import {bind} from '/node_modules/hyperhtml/esm.js'
import {loadState, saveState} from './state.js'
import Store, {equalLocation} from './store.js'
import App from './app.js'
import {fetchWeather} from './api.js'
import createScheduler from './scheduler.js'

/**
 * @typedef { import('./store.js').WeatherLocation } WeatherLocation
 */

/**
 * Configuration
 */

/** Only show the loading animation after this time in milliseconds */
const loadingTimeout = 1000

/**
 * App entry point
 */

if (/** @type {any} */ (window).supportedBrowser) {
  main(bind(/** @type {Element} */ (document.querySelector('.app'))))
}

/**
 * @param { import('/node_modules/hyperhtml/esm.js').BoundTemplateFunction<Element> } html
 * @returns {Promise<void>}
 */
async function main (html) {
  const weatherFont = new FontFaceObserver('weathericons')
  try {
    await weatherFont.load()
  } catch (e) {
    console.error('Loading weather font timed out', e)
  } finally {
    document.body.classList.add('fonts-loaded')
  }

  const store = new Store()
  store.subscribe(render)
  store.loadSettings(loadState())

  const scheduler = createScheduler(async () => {
    store.loadWeather(await fetchWeather(store.state.location))
  })

  /** @type {number} */
  let loadingTimeoutHandle

  /**
   * @param {string} route
   */
  async function navigate (route) {
    scheduler.stopUpdating()

    if (route === 'my-location') {
      store.navigate('myLocation')
    } else {
      if (store.state.weather) {
        store.navigate('weather')
      } else {
        refreshWeather()
      }
      scheduler.startUpdating()
    }
  }

  router(navigate)

  /**
   * @param {WeatherLocation} newLocation
   */
  function onLocationSelect (newLocation) {
    if (!equalLocation(newLocation, store.state.location)) {
      store.setLocation(newLocation)
      store.addFavorite(newLocation)
      saveState({
        location: store.state.location,
        favoriteLocations: store.state.favoriteLocations
      })
      refreshWeather()
    }
    window.location.hash = '#'
  }

  /**
   * @param {Date} day
   */
  function onDaySelect (day) {
    store.toggleSelectedDay(day)
  }

  function render () {
    html`${App(store.state, onLocationSelect, refreshWeather, navigate, onDaySelect)}`
  }

  async function refreshWeather () {
    clearTimeout(loadingTimeoutHandle)
    loadingTimeoutHandle = setTimeout(showLoading, loadingTimeout)

    try {
      store.loadWeather(await fetchWeather(store.state.location))
    } catch (e) {
      console.error('Error fetching weather', e)
      store.failFetch()
    } finally {
      clearTimeout(loadingTimeoutHandle)
      store.navigate('weather')
    }
  }

  function showLoading () {
    store.navigate('loading')
  }
}

/**
 * @param {(hash: string) => void} onChange
 * @returns {void}
 */
function router (onChange) {
  const hash = () => window.location.hash.substring(1)
  window.addEventListener('hashchange', () => onChange(hash()))
  onChange(hash())
}

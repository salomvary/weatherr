/* global FontFaceObserver */
/// <reference path="./main.d.ts" />

import '/node_modules/fontfaceobserver/fontfaceobserver.standalone.js'
import {bind} from '/node_modules/hyperhtml/esm.js'
import {loadState, saveState} from './state.js'
import Store, {equalLocation} from './store.js'
import App from './app.js'

/**
 * @typedef { import('./store.js').WeatherLocation } WeatherLocation
 */

/**
 * Configuration
 */

/** The positive integer update frequency in hours */
const updateIntervalHours = 1

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

  /** @type {(() => void) | null} */
  let clearUpdateSchedule

  /** @type {number} */
  let loadingTimeoutHandle

  /**
   * @param {string} route
   */
  async function navigate (route) {
    stopUpdating()

    if (route === 'my-location') {
      store.navigate('myLocation')
    } else {
      if (store.state.weather) {
        store.navigate('weather')
      } else {
        refreshWeather()
      }
      startUpdating()
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
      store.loadWeather(await fetchWeather(getApiUrl(store.state.location)))
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

  function startUpdating () {
    stopUpdating()

    function scheduleNextUpdate () {
      const nextUpdate = new Date()
      nextUpdate.setHours(nextUpdate.getHours() + updateIntervalHours, 0, 0, 0)
      console.info(`Scheduled next update at ${nextUpdate}`)
      clearUpdateSchedule = scheduleAt(nextUpdate, async () => {
        store.loadWeather(await fetchWeather(getApiUrl(store.state.location)))
        scheduleNextUpdate()
      })
    }

    scheduleNextUpdate()
  }

  function stopUpdating () {
    if (clearUpdateSchedule) {
      clearUpdateSchedule()
      clearUpdateSchedule = null
    }
  }
}

/**
 * Run callback at time or a bit later but never earlier
 *
 * @param {Date} time
 * @param {() => void} callback
 * @returns {() => void} function to clear the schedule
 */
function scheduleAt (time, callback) {
  /** @type {number} */
  let handle

  /**
   * @param {Date} time
   * @param {() => void} callback
   */
  function _scheduleAt (time, callback) {
    const remainingTime = +time - +new Date()
    if (remainingTime > 0) {
      handle = setTimeout(() => _scheduleAt(time, callback), remainingTime)
    } else {
      callback()
    }
  }

  _scheduleAt(time, callback)

  return function clearSchedule () {
    clearTimeout(handle)
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

/**
 * @param {WeatherLocation} location
 */
function getApiUrl ({lat, lon}) {
  const local = window.location.protocol === 'file:' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.startsWith('192.168.')
  return local ? 'weather.json' : `https://darksky-proxy.herokuapp.com/${lat},${lon}?units=si`
}

/**
 * @param {string} url
 */
async function fetchWeather (url) {
  const response = await fetch(url)
  if (response.ok) {
    const body = await response.text()
    return JSON.parse(body, function reviver (k, v) {
      if (k === 'time' && typeof v === 'number') {
        return new Date(v * 1000)
      } else {
        return v
      }
    })
  } else {
    throw new Error(`Unexpected response status when fetching weather: ${response.status}`)
  }
}

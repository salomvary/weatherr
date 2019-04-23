/* global FontFaceObserver */
/// <reference path="./main.d.ts" />

import '/node_modules/fontfaceobserver/fontfaceobserver.standalone.js'
import {bind} from '/node_modules/hyperhtml/esm.js'
import {getInitialState, saveState} from './state.js'
import App from './app.js'

/**
 * Configuration
 */

/** The positive integer update frequency in hours */
const updateIntervalHours = 1

/** Only show the loading animation after this time in milliseconds */
const loadingTimeout = 1000

/** Limit favorite locations */
const maxFavoriteLocations = 5

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

  const state = getInitialState()

  /** @type {(() => void) | null} */
  let clearUpdateSchedule

  /** @type {number} */
  let loadingTimeoutHandle

  /**
   * @param {string} route
   */
  async function navigate (route) {
    stopUpdating()
    state.fetchError = false

    if (route === 'my-location') {
      state.screen = 'myLocation'
      render()
    } else {
      if (state.weather) {
        state.screen = 'weather'
        render()
      } else {
        refreshWeather()
      }
      startUpdating()
    }
  }

  router(navigate)

  /**
   * @param {import('./state.js').WeatherLocation} newLocation
   */
  function onLocationSelect (newLocation) {
    if (!equalLocation(newLocation, state.location)) {
      state.location = newLocation
      const isFavorite = state.favoriteLocations.some((l) => equalLocation(l, newLocation))
      if (!isFavorite) {
        state.favoriteLocations.unshift(newLocation)
        state.favoriteLocations.splice(maxFavoriteLocations)
      }
      saveState({
        location: state.location,
        favoriteLocations: state.favoriteLocations
      })
      refreshWeather()
    }
    window.location.hash = '#'
  }

  /**
   * @param {import('./state.js').WeatherLocation} a
   * @param {import('./state.js').WeatherLocation} b
   */
  function equalLocation (a, b) {
    return (
      a.lat === b.lat ||
      a.lon === b.lon ||
      a.name === b.name
    )
  }

  function render () {
    html`${App(state, onLocationSelect, refreshWeather, navigate)}`
  }

  async function refreshWeather () {
    clearTimeout(loadingTimeoutHandle)
    loadingTimeoutHandle = setTimeout(showLoading, loadingTimeout)

    try {
      state.weather = truncateWeather(await fetchWeather(getApiUrl(state.location)))
    } catch (e) {
      console.error('Error fetching weather', e)
      state.fetchError = true
    } finally {
      clearTimeout(loadingTimeoutHandle)
      state.screen = 'weather'
    }
    render()
  }

  function showLoading () {
    state.screen = 'loading'
    render()
  }

  function startUpdating () {
    stopUpdating()

    function scheduleNextUpdate () {
      const nextUpdate = new Date()
      nextUpdate.setHours(nextUpdate.getHours() + updateIntervalHours, 0, 0, 0)
      console.info(`Scheduled next update at ${nextUpdate}`)
      clearUpdateSchedule = scheduleAt(nextUpdate, async () => {
        state.weather = truncateWeather(await fetchWeather(getApiUrl(state.location)))
        render()
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

  /**
   * @param {darksky.Weather} weather
   * @returns {darksky.Weather}
   */
  function truncateWeather (weather) {
    const now = new Date()
    const oneHour = 60 * 60 * 1000
    /**
     * @param {darksky.HourlyData | darksky.DailyData} dataPoint
     */
    const notOlderThanOneHour = function ({time}) {
      return now.getTime() - time.getTime() < oneHour
    }
    const hourly = weather.hourly.data.filter(notOlderThanOneHour)
    const daily = weather.daily.data.filter(notOlderThanOneHour)
    const [hourlyNow] = hourly
    let currently
    if (!notOlderThanOneHour(weather.currently) && hourlyNow) {
      // Make up a new "currently" from the most recent "hourly"
      currently = hourlyNow
    } else {
      currently = weather.currently
    }

    return {
      currently,
      hourly: {data: hourly},
      daily: {data: daily}
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
 * @param {import('./state.js').WeatherLocation} location
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

/**
 * @typedef {object} WeatherLocation
 * @property {number} lat
 * @property {number} lon
 * @property {string} name
 * @property {string} region
 */

/**
 * @typedef {object} PersistentState
 * @property {WeatherLocation} location
 * @property {WeatherLocation[]} favoriteLocations
 *
 * Global application state
 *
 * @typedef {object} State
 * @property {WeatherLocation} location
 * @property {WeatherLocation[]} favoriteLocations
 * @property {darksky.Weather | null} weather
 * @property {'myLocation' | 'weather' | 'loading'} screen
 * @property {boolean} fetchError
 */

/** @type {State} */
const defaultState = {
  location: {lat: 52.51925, lon: 13.40881, name: 'Berlin', region: ''},
  favoriteLocations: [],
  weather: null,
  screen: 'loading',
  fetchError: false
}

/** @returns {State} */
export function getInitialState () {
  const storedState = loadState()
  return Object.assign(defaultState, storedState)
}

/**
 * @returns {PersistentState=}
 */
function loadState () {
  try {
    const settings = localStorage.getItem('weather-settings')
    return settings && JSON.parse(settings)
  } catch (e) {
    console.error('Can not read storage', e)
    return undefined
  }
}

/**
 * @param {PersistentState} state
 * @returns {void}
 */
export function saveState (state) {
  try {
    localStorage.setItem('weather-settings', JSON.stringify(state))
  } catch (e) {
    console.error('Can not write storage', e)
  }
}

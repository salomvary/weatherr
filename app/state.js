/**
 * State persisted across sessions
 *
 * @typedef {object} PersistentState
 * @property {WeatherLocation} location
 * @property {WeatherLocation[]} favoriteLocations
 */

/**
 * @returns {PersistentState=}
 */
export function loadState () {
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

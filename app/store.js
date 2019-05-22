/** Limit favorite locations */
const maxFavoriteLocations = 5

/** @type {State} */
const defaultState = {
  location: {lat: 52.51925, lon: 13.40881, name: 'Berlin', region: ''},
  favoriteLocations: [],
  weather: null,
  screen: 'loading',
  fetchError: false
}

export default class Store {
  /**
   * @param {State} initialState
   */
  constructor (initialState = defaultState) {
    /**
     * @readonly
     */
    this.state = Object.assign({}, initialState)

    /**
     * @private
     * @type {Array<() => void>}
     */
    this.listeners = []
  }

  /**
   * Load persistent settings
   *
   * @param {Partial<State> | undefined} state
   */
  loadSettings (state) {
    Object.assign(this.state, state)
    this.notify()
  }

  /**
   * Load weather forecast
   *
   * @param {darksky.Weather} weather
   */
  loadWeather (weather) {
    this.state.weather = truncateWeather(weather)
    this.notify()
  }

  /**
   * Signals failing weather fetch
   */
  failFetch () {
    this.state.fetchError = true
    this.notify()
  }

  /**
   * Navigate to the given screen
   *
   * @param {'myLocation' | 'weather' | 'loading'} screen
   */
  navigate (screen) {
    this.state.screen = screen
    this.state.fetchError = false
    this.notify()
  }

  /**
   * @param {WeatherLocation} location
   */
  setLocation (location) {
    this.state.location = location
    this.notify()
  }

  /**
   * @param {WeatherLocation} location
   */
  addFavorite (location) {
    const isFavorite = this.state.favoriteLocations.some((l) => equalLocation(l, location))
    if (!isFavorite) {
      this.state.favoriteLocations.unshift(location)
      this.state.favoriteLocations.splice(maxFavoriteLocations)
    }
    this.notify()
  }

  /**
   * @private
   */
  notify () {
    this.listeners.forEach(listener => listener())
  }

  /**
   * @param {() => void} listener
   */
  subscribe (listener) {
    this.listeners.push(listener)
  }
}

/**
 * Global application state
 *
 * @typedef {object} State
 * @property {WeatherLocation} location
 * @property {WeatherLocation[]} favoriteLocations
 * @property {darksky.Weather | null} weather
 * @property {'myLocation' | 'weather' | 'loading'} screen
 * @property {boolean} fetchError
 */

/**
 * Geographical location of a weather forecast
 *
 * @typedef {object} WeatherLocation
 * @property {number} lat
 * @property {number} lon
 * @property {string} name
 * @property {string} region
 */

/**
 * Compare two locations
 *
 * @param {WeatherLocation} a
 * @param {WeatherLocation} b
 */
export function equalLocation (a, b) {
  return (
    a.lat === b.lat ||
    a.lon === b.lon ||
    a.name === b.name
  )
}

/**
 * Remove past hours and days from the forecast
 *
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
  /**
   * @param {darksky.HourlyData | darksky.DailyData} dataPoint
   */
  const notOlderThanOneDay = function ({time}) {
    return now.getTime() - time.getTime() < 24 * oneHour
  }
  const hourly = weather.hourly.data.filter(notOlderThanOneHour)
  const daily = weather.daily.data.filter(notOlderThanOneDay)
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

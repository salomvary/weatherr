/* global FontFaceObserver */
/// <reference path="./main.d.ts" />

import './node_modules/fontfaceobserver/fontfaceobserver.standalone.js'
import {wire, bind} from './node_modules/hyperhtml/esm.js'

/**
 * @typedef {any} Wired
 */

/**
 * Configuration
 */
const updateInterval = 60 * 60 * 1000

/** Only show the loading animation after this time in milliseconds */
const loadingTimeout = 1000

/** Limit favorite locations */
const maxFavoriteLocations = 5

/**
 * @type {Object.<string, string>}
 */
const icons = {
  'clear-day': 'wi-day-sunny',
  'clear-night': 'wi-night-clear',
  'rain': 'wi-rain',
  'snow': 'wi-snow',
  'sleet': 'wi-sleet',
  'wind': 'wi-windy',
  'fog': 'wi-fog',
  'cloudy': 'wi-cloudy',
  'partly-cloudy-day': 'wi-day-cloudy',
  'partly-cloudy-night': 'wi-night-cloudy'
}

/**
 * App entry point
 */

if (/** @type {any} */ (window).supportedBrowser) {
  main(bind(/** @type {Element} */ (document.querySelector('.app'))))
}

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

/**
 * @param { import('./node_modules/hyperhtml/esm').BoundTemplateFunction<Element> } html
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

  const storedState = loadState()

  /** @type {State} */
  const defaultState = {
    location: {lat: 52.51925, lon: 13.40881, name: 'Berlin', region: ''},
    favoriteLocations: [],
    weather: null,
    screen: 'loading',
    fetchError: false
  }

  /** @type {State} */
  const state = Object.assign(defaultState, storedState)

  /** @type {number} */
  let updateIntervalHandle

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
   * @param {WeatherLocation} newLocation
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
   * @param {WeatherLocation} a
   * @param {WeatherLocation} b
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
    updateIntervalHandle = setInterval(async () => {
      state.weather = truncateWeather(await fetchWeather(getApiUrl(state.location)))
      render()
    }, updateInterval)
  }

  function stopUpdating () {
    clearInterval(updateIntervalHandle)
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
      return now.getTime() - new Date(time * 1000).getTime() < oneHour
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
function saveState (state) {
  try {
    localStorage.setItem('weather-settings', JSON.stringify(state))
  } catch (e) {
    console.error('Can not write storage', e)
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
    return response.json()
  } else {
    throw new Error(`Unexpected response status when fetching weather: ${response.status}`)
  }
}

/**
 * Root component
 * @param {State} state
 * @param {(location: WeatherLocation) => void} onLocationSelect
 * @param {() => void} onRetryFetchWeather
 * @param {(location: string) => void} navigate
 *
 * @returns {Wired}
 */
function App (state, onLocationSelect, onRetryFetchWeather, navigate) {
  return wire(state, ':app')`${
    /** @type {Object.<string, (state: State) => Wired>} */
    ({
      loading: (state) => LoadingView(state.location, navigate),
      weather: (state) => WeatherView(state, onRetryFetchWeather, navigate),
      myLocation: () => LocationSearchView(state.favoriteLocations, onLocationSelect, navigate)

    })[state.screen](state)
  }`
}

/**
 * Loading indicator screen component
 *
 * @param {WeatherLocation} location
 * @param {(location: string) => void} navigate
 *
 * @returns {Wired}
 */
function LoadingView (location, navigate) {
  return wire(location, ':loading-location')`
    <div class="view">
      ${WeatherNavbar(location, navigate)}
      <article class="page loading-page">
        ${Icon({icon: 'clear-day', class: 'loading-icon'})}
        <p>Predicting the unpredictable…</p>
      </div>
    </div>
  `
}

/**
 * Weather view
 *
 * @param {State} state
 * @param {() => void} onRetry
 * @param {(location: string) => void} navigate
 *
 * @returns {Wired}
 */
function WeatherView (state, onRetry, navigate) {
  return wire(state, ':weather-view')`
    <div class="view">
      ${WeatherNavbar(state.location, navigate)}
      <article class="page page-with-navbar">
        ${state.fetchError ? FetchError({onRetry}) : Weather(/** @type {darksky.Weather} */ (state.weather))}
      </article>
    </div>
  `
}

/**
 * @param {object} props
 * @param {() => void} props.onRetry
 *
 * @returns {Wired}
 */
function FetchError (props) {
  return wire(props)`
    <div class="fetch-error">
      <p>${Icon({icon: 'wi-thunderstorm', class: 'fetch-error-icon'})}</p>
      <p>Error fetching weather data.</p>
      <p><button class="btn" onclick=${props.onRetry}>Retry</button></p>
    </div>
  `
}

/**
 * @param {WeatherLocation} location
 * @param {(location: string) => void} navigate
 *
 * @returns {Wired}
 */
function WeatherNavbar (location, navigate) {
  return wire(location)`
    <nav class="navbar">
      <h1 class="navbar-title">
        <a class="weather-navbar-location" href="#my-location" onclick=${() => navigate('my-location')}>
          ${location.name}
          <img src="${'/search.svg'.toString('url')}" class="icon" alt="Change location">
        </a>
      </h1>
    </nav>
  `
}

/**
 * @param {darksky.Weather} weather
 *
 * @returns {Wired}
 */
function Weather (weather) {
  const [today] = weather.daily.data
  return wire(weather)`
    <div class="weather">
      ${Currently(weather.currently, today || {})}
      ${Hourly(weather.hourly)}
      ${Daily(weather.daily)}
    </div>
  `
}

/**
 * @param {darksky.HourlyData} currently
 * @param {darksky.DailyData} today
 *
 * @returns {Wired}
 */
function Currently (currently, today) {
  return wire(currently)`
    <section class="currently">
      <div class="currently-temperatures">
        <div class="currently-temperature">
          ${Temperature({value: currently.temperature})}
        </div>
        <div class="currently-highlow">
          High ${Temperature({value: today.temperatureHigh})}
          Low ${Temperature({value: today.temperatureLow})}
        </div>
      </div>
      <div class="currently-details">
        <div class="currently-icon">${Icon({icon: currently.icon})}</div>
        <div class="currently-summary">${currently.summary}</div>
      </div>
    </section>
  `
}

/**
 * @param {darksky.Forecast<darksky.HourlyData>} hourly
 *
 * @returns {Wired}
 */
function Hourly (hourly) {
  return wire(hourly)`
    <section class="forecast">
      ${hourly.data.map(Hour)}
    </section>
  `
}

/**
 * @param {darksky.HourlyData} hour
 *
 * @returns {Wired}
 */
function Hour (hour) {
  return wire(hour)`
    <div class="forecast-item">
      <div class="forecast-item-time">${formatHour(new Date(hour.time * 1000))}</div>
      <div class="forecast-item-temperature">
        ${Temperature({value: hour.temperature})}
      </div>
      <div class="forecast-item-icon">${Icon({icon: hour.icon})}</div>
    </div>
  `
}

/**
 * @param {darksky.Forecast<darksky.DailyData>} daily
 *
 * @returns {Wired}
 */
function Daily (daily) {
  return wire(daily)`
    <section class="forecast">
      ${daily.data.map(Day)}
    </section>
  `
}

/**
 * @param {object} props
 * @param {number} props.value
 *
 * @returns {Wired}
 */
function Temperature (props) {
  return wire(props)`
    <span class="temperature">${Math.round(props.value)}</span>
  `
}

/**
 * @param {Date} time
 *
 * @returns {string}
 */
function formatHour (time) {
  return time.toLocaleTimeString('en-US-u-hc-h24', {hour: '2-digit', minute: '2-digit'})
}

/**
 * @param {Date} day
 *
 * @returns {string}
 */
function formatDay (day) {
  const now = new Date()
  if (isNextDay(now, day, 0)) {
    return 'Today'
  } else if (isNextDay(now, day, 1)) {
    return 'Tomorrow'
  } else {
    return day.toLocaleDateString('en-US', {weekday: 'long'})
  }
}

/**
 * @param {Date} day
 *
 * @returns {string}
 */
function formatDate (day) {
  return day.toLocaleDateString('en-US', {month: '2-digit', day: '2-digit'})
}

/**
 * @param {Date} now
 * @param {Date} date
 * @param {number} offset
 *
 * @returns {boolean}
 */
function isNextDay (now, date, offset) {
  const dateWithOffset = new Date(now)
  dateWithOffset.setDate(now.getDate() + offset)
  return (date.getDate() === dateWithOffset.getDate() &&
        date.getMonth() === dateWithOffset.getMonth() &&
        date.getFullYear() === dateWithOffset.getFullYear())
}

/**
 * @param {darksky.DailyData} day
 *
 * @returns {Wired}
 */
function Day (day) {
  return wire(day)`
    <div class="forecast-item">
      <div class="forecast-item-time">${formatDay(new Date(day.time * 1000))}</div>
      <div class="forecast-item-time">${formatDate(new Date(day.time * 1000))}</div>
      <div class="forecast-item-highlow">
        <div class="forecast-item-temperature">
          ${Temperature({value: day.temperatureHigh})}
        </div>
        <div class="forecast-item-temperature">
          ${Temperature({value: day.temperatureLow})}
        </div>
      </div>
      <div class="forecast-item-icon">${Icon({icon: day.icon})}</div>
    </div>
  `
}

/**
 * @param {object} props
 * @param {string} props.icon
 * @param {string=} props.class
 */
function Icon (props) {
  return wire(props)`<i class=${['wi', icons[props.icon] || props.icon, props.class].join(' ')}></i>`
}

/**
 * Location search view
 *
 * @param {WeatherLocation[]} favoriteLocations
 * @param {(result: WeatherLocation) => void} onResultSelect
 * @param {(location: string) => void} navigate
 *
 * @returns {any}
 */
function LocationSearchView (favoriteLocations, onResultSelect, navigate) {
  const baseUrl = 'https://nominatim.openstreetmap.org/search'
  const state = {
    searching: false,
    /** @type {string | null} */
    error: null,
    results: favoriteLocations || []
  }
  const html = wire(state)

  /**
   * @param {PointerEvent} event
   */
  function onClearClick (event) {
    const input = /** @type {any} */ (event.currentTarget).form.query
    input.focus()
    input.value = ''
    state.error = null
    state.results = favoriteLocations || []
    render()
  }

  /**
   * @param {Event} event
   *
   * @returns {Promise<void>}
   */
  async function onSubmit (event) {
    event.preventDefault()
    /** @type {string} */
    const query = /** @type {HTMLFormElement} */ (event.target).query.value.trim()
    if (query.length === 0) return
    state.error = null
    state.results = []
    state.searching = true
    render()
    try {
      state.results = await fetchResults(query)
      if (state.results.length === 0) {
        state.error = `Nothing was found for "${query}" :(`
      }
    } catch (e) {
      state.error = 'Location search failed :('
      console.error('Error during location search', e)
    } finally {
      state.searching = false
    }
    render()
  }

  /**
   * @typedef NominatimSearchResult
   * @property {number} lat
   * @property {number} lon
   * @property {string} display_name
   */

  /**
   * @param {string} query
   *
   * @returns {Promise<WeatherLocation[]>}
   */
  async function fetchResults (query) {
    const url = new URL(baseUrl)
    const params = url.searchParams
    params.set('format', 'json')
    params.set('limit', '5')
    params.set('q', query)
    const response = await fetch(url.toString())
    if (response.ok) {
      /** @type {NominatimSearchResult[]} */
      const results = await response.json()
      return results.map(parseAddressResult)
    } else {
      throw new Error(`Error searching location, status: ${response.status}`)
    }
  }

  /**
   * @param {NominatimSearchResult} searchResult
   *
   * @returns {WeatherLocation}
   */
  // eslint-disable-next-line camelcase
  function parseAddressResult ({lat, lon, display_name}) {
    // Would be nice to not construct the address by string parsing but
    // the structured address result is not well documented in Nominatim:
    // https://help.openstreetmap.org/questions/55122/where-is-nominatim-adress-keys-list
    const firstComma = display_name.indexOf(',')
    const name = display_name.substring(0, firstComma)
    const region = display_name.substring(firstComma + 1).trim()
    return {
      // eslint-disable-next-line camelcase
      name: name || display_name,
      region,
      lat,
      lon
    }
  }

  /**
   * @this {HTMLInputElement}
   */
  function onInputConnected () {
    this.focus()
  }

  /**
   * @returns {Wired}
   */
  function render () {
    return html`
      <div class="view location-search-view">
        <nav class="navbar">
          <form class="searchbar" action="" onsubmit=${onSubmit}>
            <div class="input search-input-wrap">
              <input
                onconnected=${onInputConnected}
                type="search" name="query"
                autofocus
                placeholder="City"
                autocomplete="off">
              <img src="${'/search.svg'.toString('url')}" class="icon search-icon" alt="Change location">
              <button class="search-input-clear btn btn-flat btn-icon" type="button" onclick=${onClearClick}>
                <img src="${'/clear.svg'.toString('url')}" class="icon clear-icon" alt="Clear">
              </button>
            </div>
            <button
              type="submit" class="btn location-search-btn"
              disabled=${state.searching}
            >
              ${state.searching ? 'Searching…' : 'Search'}
            </button>
            <a href="#" onclick=${() => navigate('')}>
              <button class="btn btn-flat" type="button">Cancel</button>
            </a>
          </form>
        </nav>

        <article class="page page-with-navbar">
          <ul class="location-search-results">
            ${state.error ? wire()`
              <li class="location-search-error">${state.error}</li>
            ` : null}
            ${state.results.map((result) => LocationSearchResult(result, onResultSelect))}
          </ul>
        </article>
      </div>
    `
  }

  return render()
}

/**
 * @param {WeatherLocation} result
 * @param {(result: WeatherLocation) => void} onResultSelect
 *
 * @returns {Wired}
 */
function LocationSearchResult (result, onResultSelect) {
  return wire(result)`
    <li
      class="location-search-result"
      onclick=${() => onResultSelect(result)}
    >
      <p class="location-search-name">${result.name}</p>
      <p class="location-search-region">${result.region}</p>
    </li>
  `
}

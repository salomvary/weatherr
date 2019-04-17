import {wire} from './node_modules/hyperhtml/esm.js'
import WeatherView from './weather.js'
import LocationSearchView from './location-search-view.js'
import WeatherNavbar from './weather-navbar.js'
import Icon from './icon.js'

/**
 * Root component
 *
 * @param {import('./state.js').State} state
 * @param {(location: import('./state.js').WeatherLocation) => void} onLocationSelect
 * @param {() => void} onRetryFetchWeather
 * @param {(location: string) => void} navigate
 *
 * @returns {any}
 */
export default function App (state, onLocationSelect, onRetryFetchWeather, navigate) {
  return wire(state, ':app')`${
    /** @type {Object.<string, (state: import('./state.js').State) => any>} */
    ({
      loading: (state) => LoadingView(state.location, navigate),
      weather: (state) => WeatherView(state, onRetryFetchWeather, navigate),
      myLocation: () => LocationSearchView(state.favoriteLocations, onLocationSelect, navigate)
    })[state.screen](state)}`
}

/**
 * Loading indicator screen component
 *
 * @param {import('./state.js').WeatherLocation} location
 * @param {(location: string) => void} navigate
 *
 * @returns {any}
 */
export function LoadingView (location, navigate) {
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

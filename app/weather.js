import {wire} from '/node_modules/hyperhtml/esm.js'
import WeatherNavbar from './weather-navbar.js'
import Icon from './icon.js'

/**
 * Weather view
 *
 * @param {import('./state').State} state
 * @param {() => void} onRetry
 * @param {(location: string) => void} navigate
 *
 * @returns {any}
 */
export default function WeatherView (state, onRetry, navigate) {
  return wire(state, ':weather-view')`
    <div class="view">
      ${WeatherNavbar(state.location, navigate)}
      <article class="page page-with-navbar">
        ${state.fetchError ? FetchError({onRetry}) : Weather(/** @type {darksky.Weather} */(state.weather))}
      </article>
    </div>
  `
}

/**
 * @param {object} props
 * @param {() => void} props.onRetry
 *
 * @returns {any}
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
 * @param {darksky.Weather} weather
 *
 * @returns {any}
 */
export function Weather (weather) {
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
 * @returns {any}
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
 * @returns {any}
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
 * @returns {any}
 */
function Hour (hour) {
  return wire(hour)`
    <div class="forecast-item">
      <div class="forecast-item-time">${formatHour(hour.time)}</div>
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
 * @returns {any}
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
 * @returns {any}
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
 * @returns {any}
 */
function Day (day) {
  return wire(day)`
    <div class="forecast-item">
      <div class="forecast-item-time">${formatDay(day.time)}</div>
      <div class="forecast-item-time">${formatDate(day.time)}</div>
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

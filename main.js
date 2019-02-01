import {hyper, wire, bind, Component} from './hyperhtml.js'

main()

async function main () {
  await update()

  const updateInterval = 60 * 60 * 1000
  let updateIntervalHandle

  window.addEventListener('hashchange', async function () {
    await update()
    clearInterval(updateIntervalHandle)
    updateIntervalHandle = setInterval(update, updateInterval)
  })

  updateIntervalHandle = setInterval(update, updateInterval)
}

async function update () {
  const weather = await fetchWeather(getUrl())
  bind(document.querySelector('.app'))`
    ${App(weather)}
  `
}

function getUrl () {
  const hash = window.location.hash.substring(1) || '52.51925,13.40881?units=si'
  const local = window.location.protocol === 'file:' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  return local ? 'weather.json' : `https://darksky-proxy.herokuapp.com/${hash}`
}

async function fetchWeather (url) {
  const response = await fetch(url)
  return await response.json()
}

function App (weather) {
  return wire(weather)`
    ${Currently(weather.currently)}
    ${Hourly(weather.hourly)}
    ${Daily(weather.daily)}
  `
}

function Currently (currently) {
  return wire(currently)`
    <div class="currently row">
      <div class="temperature">${Math.round(currently.temperature)}</div>
    </div>
  `
}

function Hourly (hourly) {
  return wire(hourly)`
    <div class="hourly row">
      ${hourly.data.map(Hour)}
    </div>
  `
}

function Hour (hour) {
  return wire(hour)`
    <div class="hour cell">
      <div>${formatHour(new Date(hour.time * 1000))}</div>
      <div class="temperature">${Math.round(hour.temperature)}</div>
      <div class="icon">${Icon({icon: hour.icon})}</div>
    </div>
  `
}

function Daily (daily) {
  return wire(daily)`
    <div class="daily row">
      ${daily.data.map(Day)}
    </div>
  `
}

function formatHour (time) {
  return time.toLocaleTimeString('en-US-u-hc-h24', {hour: '2-digit', minute:'2-digit'})
}

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

function formatDate (day) {
  return day.toLocaleDateString('en-US', {month: '2-digit', day:'2-digit'})
}

function isNextDay (now, date, offset) {
  const dateWithOffset = new Date(now)
  dateWithOffset.setDate(now.getDate() + offset)
  return (date.getDate() == dateWithOffset.getDate()
        && date.getMonth() == dateWithOffset.getMonth()
        && date.getFullYear() == dateWithOffset.getFullYear())
}

function Day (day) {
  return wire(day)`
    <div class="day cell">
      <div>${formatDay(new Date(day.time * 1000))}</div>
      <div>${formatDate(new Date(day.time * 1000))}</div>
      <div class="temperature">${Math.round(day.temperatureHigh)}</div>
      <div class="temperature">${Math.round(day.temperatureLow)}</div>
      <div class="icon">${Icon({icon: day.icon})}</div>
    </div>
  `
}

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
  'partly-cloudy-night': 'wi-night-cloudy',
}

function Icon(props) {
  return wire(props)`<i class=${['wi', icons[props.icon]].join(' ')}></i>`
}

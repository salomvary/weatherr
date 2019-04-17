import {wire} from './node_modules/hyperhtml/esm.js'

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
 * @param {object} props
 * @param {string} props.icon
 * @param {string=} props.class
 */
export default function Icon (props) {
  return wire(props)`<i class=${['wi', icons[props.icon] || props.icon, props.class].join(' ')}></i>`
}

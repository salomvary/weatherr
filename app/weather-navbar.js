import {wire} from '/node_modules/hyperhtml/esm.js'

/**
 * @param {import('./store').WeatherLocation} location
 * @param {(location: string) => void} navigate
 *
 * @returns {any}
 */
export default function WeatherNavbar (location, navigate) {
  return wire(location)`
    <nav class="navbar">
      <h1 class="navbar-title">
        <a class="weather-navbar-location" href="#my-location" onclick=${() => navigate('my-location')}>
          ${location.name}
          <img src="${'/app/search.svg'.toString('url')}" class="icon" alt="Change location">
        </a>
      </h1>
    </nav>
  `
}

import{wire}from'/static/esm.076a4de10f.js';import WeatherView from'./weather.a79e36819c.js';import LocationSearchView from'./location-search-view.c30f902d74.js';import WeatherNavbar from'./weather-navbar.14a527c474.js';import Icon from'./icon.926dbf2cb7.js';export default function App(e,i,o,a,r){return wire(e,':app')`${{loading:e=>LoadingView(e.location,a),weather:e=>WeatherView(e,o,a,r),myLocation:()=>LocationSearchView(e.favoriteLocations,i,a)}[e.screen](e)}`}export function LoadingView(e,i){return wire(e,':loading-location')`
    <div class="view">
      ${WeatherNavbar(e,i)}
      <article class="page loading-page">
        ${Icon({icon:'clear-day','class':'loading-icon'})}
        <p>Predicting the unpredictable…</p>
      </div>
    </div>
  `};
import{wire}from'/static/esm.076a4de10f.js';export default function WeatherNavbar(a,r){return wire(a)`
    <nav class="navbar">
      <h1 class="navbar-title">
        <a class="weather-navbar-location" href="#my-location" onclick=${()=>r('my-location')}>
          ${a.name}
          <img src="${'/static/search.a87eca9ea0.svg'}" class="icon" alt="Change location">
        </a>
      </h1>
    </nav>
  `};
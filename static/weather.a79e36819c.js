import{wire}from'/static/esm.076a4de10f.js';import WeatherNavbar from'./weather-navbar.14a527c474.js';import Icon from'./icon.926dbf2cb7.js';export default function WeatherView(e,t,r,a){return wire(e,':weather-view')`
    <div class="view">
      ${WeatherNavbar(e.location,r)}
      <article class="page page-with-navbar">
        ${e.fetchError?FetchError({onRetry:t}):Weather(e.weather,e.selectedDay,a)}
      </article>
    </div>
  `}function FetchError(e){return wire(e)`
    <div class="fetch-error">
      <p>${Icon({icon:'wi-thunderstorm','class':'fetch-error-icon'})}</p>
      <p>Error fetching weather data.</p>
      <p><button class="btn" onclick=${e.onRetry}>Retry</button></p>
    </div>
  `}export function Weather(e,t,r){const [a]=e.daily.data;return wire(e)`
    <div class="weather">
      ${Currently(e.currently,a||{})}
      ${Hourly(e.hourly,t)}
      ${Daily(e.daily,t,r)}
    </div>
  `}function Currently(e,t){return wire(e)`
    <section class="currently">
      <div class="currently-temperatures">
        <div class="currently-temperature">
          ${Temperature({value:e.temperature})}
        </div>
        <div class="currently-highlow">
          High ${Temperature({value:t.temperatureHigh})}
          Low ${Temperature({value:t.temperatureLow})}
        </div>
      </div>
      <div class="currently-details">
        <div class="currently-icon">${Icon({icon:e.icon})}</div>
        <div class="currently-summary">${e.summary}</div>
      </div>
    </section>
  `}function Hourly(e,t){const r=e.data.map(Hour);let a=null;if(t){const i=new Date(t);i.setHours(7);const o=e.data.findIndex(e=>e.time>=i);a=o>-1?r[o]:null}const i=wire(e)`
    <section class="forecast">
      ${r}
    </section>
  `;return i.scrollLeft=a?a.offsetLeft-i.offsetLeft-8:0,i}function Hour(e){return wire(e)`
    <div class="forecast-item">
      <div class="forecast-item-time">${formatHour(e.time)}</div>
      <div class="forecast-item-temperature">
        ${Temperature({value:e.temperature})}
      </div>
      <div class="forecast-item-icon">${Icon({icon:e.icon})}</div>
    </div>
  `}function Daily(e,t,r){return wire({daily:e,selectedDay:t})`
    <section class="forecast">
      ${e.data.map(e=>Day(e,null!=t&&+e.time==+t,r))}
    </section>
  `}function Temperature(e){return wire(e)`
    <span class="temperature">${Math.round(e.value)}</span>
  `}const formatHour=memoize(function(e){return e.toLocaleTimeString('en-US-u-hc-h24',{hour:'2-digit',minute:'2-digit'})}),formatDay=memoize(function(e){const t=new Date;return isNextDay(t,e,0)?'Today':isNextDay(t,e,1)?'Tomorrow':e.toLocaleDateString('en-US',{weekday:'long'})}),formatDate=memoize(function(e){return e.toLocaleDateString('en-US',{month:'2-digit',day:'2-digit'})});function memoize(e){const t=new WeakMap;return function(r){let a=t.get(r);return a||(a=e(r),t.set(r,a)),a}}function isNextDay(e,t,r){const a=new Date(e);return a.setDate(e.getDate()+r),t.getDate()===a.getDate()&&t.getMonth()===a.getMonth()&&t.getFullYear()===a.getFullYear()}function Day(e,t,r){return wire(e)`
    <div
      class=${['forecast-item','day',t?'selected':''].join(' ')}
      onclick=${t=>{t.preventDefault(),r(e.time)}}
    >
      <div class="forecast-item-time">${formatDay(e.time)}</div>
      <div class="forecast-item-time">${formatDate(e.time)}</div>
      <div class="forecast-item-highlow">
        <div class="forecast-item-temperature">
          ${Temperature({value:e.temperatureHigh})}
        </div>
        <div class="forecast-item-temperature">
          ${Temperature({value:e.temperatureLow})}
        </div>
      </div>
      <div class="forecast-item-icon">${Icon({icon:e.icon})}</div>
    </div>
  `};
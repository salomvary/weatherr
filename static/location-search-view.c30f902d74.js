import{wire}from'/static/esm.076a4de10f.js';export default function LocationSearchView(t,r,n){const a='https://nominatim.openstreetmap.org/search',e={searching:!1,error:null,results:t||[]},s=wire(e);async function o(t){t.preventDefault();const r=t.target.query.value.trim();if(0!==r.length){e.error=null,e.results=[],e.searching=!0,i();try{e.results=await async function(t){const r=new URL(a),n=r.searchParams;n.set('format','json'),n.set('limit','5'),n.set('q',t);const e=await fetch(r.toString());if(e.ok){const t=await e.json();return t.map(c)}throw new Error(`Error searching location, status: ${e.status}`)}(r),0===e.results.length&&(e.error=`Nothing was found for "${r}" :(`)}catch(n){e.error='Location search failed :('}finally{e.searching=!1}i()}}function c({lat:t,lon:r,display_name:n}){const a=n.indexOf(','),e=n.substring(0,a),s=n.substring(a+1).trim();return{name:e||n,region:s,lat:t,lon:r}}function i(){return s`
      <div class="view location-search-view">
        <nav class="navbar">
          <form class="searchbar" action="" onsubmit=${o}>
            <div class="input search-input-wrap">
              <input
                onconnected=${function(){this.focus()}}
                type="search" name="query"
                autofocus
                placeholder="City"
                autocomplete="off">
              <img src="${'/static/search.a87eca9ea0.svg'}" class="icon search-icon" alt="Change location">
              <button class="search-input-clear btn btn-flat btn-icon" type="button" onclick=${function(r){const n=r.currentTarget.form.query;n.focus(),n.value='',e.error=null,e.results=t||[],i()}}>
                <img src="${'/static/clear.777b93c6d5.svg'}" class="icon clear-icon" alt="Clear">
              </button>
            </div>
            <button
              type="submit" class="btn location-search-btn"
              disabled=${e.searching}
            >
              ${e.searching?'Searching…':'Search'}
            </button>
            <a href="#" onclick=${()=>n('')}>
              <button class="btn btn-flat" type="button">Cancel</button>
            </a>
          </form>
        </nav>

        <article class="page page-with-navbar">
          <ul class="location-search-results">
            ${e.error?wire()`
              <li class="location-search-error">${e.error}</li>
            `:null}
            ${e.results.map(t=>LocationSearchResult(t,r))}
          </ul>
        </article>
      </div>
    `}return i()}function LocationSearchResult(t,r){return wire(t)`
    <li
      class="location-search-result"
      onclick=${()=>r(t)}
    >
      <p class="location-search-name">${t.name}</p>
      <p class="location-search-region">${t.region}</p>
    </li>
  `};
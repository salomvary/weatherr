import {wire} from '/node_modules/hyperhtml/esm.js'

/**
 * @typedef { import('./store.js').WeatherLocation } WeatherLocation
 */

/**
 * Location search view
 *
 * @param {WeatherLocation[]} favoriteLocations
 * @param {(result: WeatherLocation) => void} onResultSelect
 * @param {(location: string) => void} navigate
 *
 * @returns {any}
 */
export default function LocationSearchView (favoriteLocations, onResultSelect, navigate) {
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
   * @returns {any}
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
              <img src="${'/app/search.svg'.toString('url')}" class="icon search-icon" alt="Change location">
              <button class="search-input-clear btn btn-flat btn-icon" type="button" onclick=${onClearClick}>
                <img src="${'/app/clear.svg'.toString('url')}" class="icon clear-icon" alt="Clear">
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
 * @returns {any}
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

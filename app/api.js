/**
 * @param {import("./store").WeatherLocation} location
 */
export async function fetchWeather (location) {
  return fetchApi(getApiUrl(location))
}

/**
 * @param {string} url
 */
async function fetchApi (url) {
  const response = await fetch(url)
  if (response.ok) {
    const body = await response.text()
    return JSON.parse(body, function reviver (k, v) {
      if (k === 'time' && typeof v === 'number') {
        return new Date(v * 1000)
      } else {
        return v
      }
    })
  } else {
    throw new Error(`Unexpected response status when fetching weather: ${response.status}`)
  }
}

/**
 * @param {import("./store").WeatherLocation} location
 */
function getApiUrl ({lat, lon}) {
  const local = window.location.protocol === 'file:' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.startsWith('192.168.')
  return local ? 'weather.json' : `https://darksky-proxy.herokuapp.com/${lat},${lon}?units=si`
}

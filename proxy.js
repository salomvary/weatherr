const http = require('http')
const httpProxy = require('http-proxy')
const port = process.env.PORT || 5000
const apiKey = process.env.API_KEY
const origins = process.env.ORIGINS || 'null'
const allowedOrigins = new Set(origins.split(',').map(_ => _.trim()))

if (!apiKey) {
  console.error('No API_KEY environment variable set')
  process.exit(1)
}

console.info('Allowed origins:', Array.from(allowedOrigins))

const proxy = httpProxy.createProxyServer({
  changeOrigin: true
})

proxy.on('proxyRes', function (proxyRes, req, res) {
  res.setHeader('access-control-allow-origin', req.headers.origin)
});

http.createServer(function(req, res) {
  if (allowedOrigins.has(req.headers.origin)) {
    proxy.web(req, res, { target: `https://api.darksky.net/forecast/${apiKey}` })
  } else {
    console.warn(`Origin '${req.headers.origin}' was rejected`)
    res.statusCode = 403
    res.end()
  }
}).listen(port)

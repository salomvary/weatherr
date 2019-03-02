module.exports = {
  'importWorkboxFrom': 'local',
  'globDirectory': 'dist/',
  'globPatterns': [
    '**/*.{html,js,png,json,svg,css,eot,ttf,woff}'
  ],
  globIgnores: [
    'static/startup-image-*'
  ],
  'swDest': 'dist/index-precache-service-worker.js'
}

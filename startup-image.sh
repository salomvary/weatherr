#!/bin/sh

set -euf

# Sources
# https://developer.apple.com/design/human-interface-guidelines/ios/icons-and-images/launch-screen/
# https://developer.apple.com/library/archive/documentation/DeviceInformation/Reference/iOSDeviceCompatibility/Displays/Displays.html
# https://medium.com/appscope/adding-custom-ios-splash-screens-to-your-progressive-web-app-41a9b18bdca3
# https://www.paintcodeapp.com/news/ultimate-guide-to-iphone-resolutions
# http://iosres.com/

# TODO the current screenshot approach does not work with odd dimensions,
# which means no launch screen for iPhone X (1125px wide)
sizing_table='
Device 	Launch screen width	Height	Device width	Height	Device pixel ratio
iPhone SE 	640	1136	320	568	2
iPhone 6s, 7, 8	750	1334	375	667	2
iPhone XR 	828	1792	414	896	3
#iPhone X, XS 	1125	2436	375	812	3
iPhone XS Max 	1242	2688	414	896	3
iPhone 7 Plus, 8 Plus	1242	2208	414	736	3
iPhone 6s Plus	1242	2208	375	667	3
9.7" iPad	1536	2048	768	1024	2
7.9" iPad mini 4	1536	2048	768	1024	2
11" iPad Pro	1668	2388	834	1194	2
10.5" iPad Pro	1668	2224	834	1112	2
12.9" iPad Pro	2048	2732	1024	1366	2
'

# Device pixel ratio of the screen used for rendering the images
screen_device_pixel_ratio=2

sizes=$(echo "$sizing_table" | tail -n +3 | grep -v '^#')

#printf "$sizes"

IFS=$'\n'

for size in $sizes; do
  screen_width=$(echo "$size" | cut -d '	' -f 2)
  screen_height=$(echo "$size" | cut -d '	' -f 3)
  device_pixel_ratio=$(echo "$size" | cut -d '	' -f 6)

  window_width=$(echo "scale=0; $screen_width / $screen_device_pixel_ratio / 1" | bc)
  window_height=$(echo "scale=0; $screen_height / $screen_device_pixel_ratio / 1" | bc)

  zoom=$(echo "scale=1; $device_pixel_ratio / $screen_device_pixel_ratio / 1" | bc)

  # Screenshots on a retina screen will be double of the window size
  # Portrait
  /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
   --headless --disable-gpu \
   "--screenshot=startup-image/startup-image-$screen_width,$screen_height.png" \
   "--window-size=$window_width,$window_height" "file://$(pwd)/startup-image.html?zoom=$zoom"
  # Landscape
  /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
   --headless --disable-gpu \
   "--screenshot=startup-image/startup-image-$screen_height,$screen_width.png" \
   "--window-size=$window_height,$window_width" "file://$(pwd)/startup-image.html?zoom=$zoom"
done

for size in $sizes; do
  device=$(echo "$size" | cut -d '	' -f 1)
  screen_width=$(echo "$size" | cut -d '	' -f 2)
  screen_height=$(echo "$size" | cut -d '	' -f 3)
  device_width=$(echo "$size" | cut -d '	' -f 4)
  device_height=$(echo "$size" | cut -d '	' -f 5)
  device_pixel_ratio=$(echo "$size" | cut -d '	' -f 6)

  # Portrait
  echo "<!-- $device portrait -->"
  echo "<link rel=\"apple-touch-startup-image\" media=\"(device-width: ${device_width}px) and (device-height: ${device_height}px) and (-webkit-device-pixel-ratio: $device_pixel_ratio) and (orientation: portrait)\" href=\"startup-image/startup-image-$screen_width,$screen_height.png\">"
  # Landscape
  echo "<!-- $device landscape -->"
  echo "<link rel=\"apple-touch-startup-image\" media=\"(device-width: ${device_width}px) and (device-height: ${device_height}px) and (-webkit-device-pixel-ratio: $device_pixel_ratio) and (orientation: landscape)\" href=\"startup-image/startup-image-$screen_height,$screen_width.png\">"
done

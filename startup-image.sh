#!/bin/sh

set -euf

# Sizes taken from here:
# https://developer.apple.com/design/human-interface-guidelines/ios/icons-and-images/launch-screen/

sizing_table='
Device 	Portrait size 	Landscape size
12.9" iPad Pro 	2048px × 2732px 	2732px × 2048px
11" iPad Pro 	1668px × 2388px 	2388px × 1668px
10.5" iPad Pro 	1668px × 2224px 	2224px × 1668px
9.7" iPad 	1536px × 2048px 	2048px × 1536px
7.9" iPad mini 4 	1536px × 2048px 	2048px × 1536px
iPhone XS Max 	1242px × 2688px 	2688px × 1242px
iPhone XS 	1125px × 2436px 	2436px × 1125px
iPhone XR 	828px × 1792px 	1792px × 828px
iPhone X 	1125px × 2436px 	2436px × 1125px
iPhone 8 Plus 	1242px × 2208px 	2208px × 1242px
iPhone 8 	750px × 1334px 	1334px × 750px
iPhone 7 Plus 	1242px × 2208px 	2208px × 1242px
iPhone 7 	750px × 1334px 	1334px × 750px
iPhone 6s Plus 	1242px × 2208px 	2208px × 1242px
iPhone 6s 	750px × 1334px 	1334px × 750px
iPhone SE 	640px × 1136px 	1136px × 640px
'

sizes=$(echo "$sizing_table" |  tail -n +3 | awk -F '\t' '{print $2; print $3}' | sort -g | uniq | sed s/px//g | sed 's/ × /,/g')

for size in $sizes; do
  width=$(echo "$size" | cut -d , -f 1)
  height=$(echo "$size" | cut -d , -f 2)
  device_width=$((width / 2))
  device_height=$((height / 2))

  # Screenshots on a retina screen will be double-width, using device width for the chrome window
  /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
    --headless --disable-gpu \
    "--screenshot=startup-image/startup-image-$size.png" \
    "--window-size=$device_width,$device_height" startup-image.html
done

for size in $sizes; do
  width=$(echo "$size" | cut -d , -f 1)
  height=$(echo "$size" | cut -d , -f 2)
  device_width=$((width / 2))
  device_height=$((height / 2))

  echo "<link rel=\"apple-touch-startup-image\" media=\"(device-width: ${device_width}px) and (device-height: ${device_height}px)\" href=\"startup-image/startup-image-$size.png\">"
done

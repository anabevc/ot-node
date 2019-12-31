#!/bin/bash
if [[ -z "$3" ]]; then
  echo "No path provided, using default config path..."
  path="$HOME/origintrail_noderc"
else
  path=$3
fi

if [[ -z $(grep "$1_price_factor" "$path") ]]; then
  sed -i "/\"blockchain\": {/a \"$1_price_factor\" : \"$2\"," "$path"
else
  sed -i "s/\(\"$1_price_factor\" : \)\"[0-9]*\"/\1\"$2\"/g" "$path"
fi
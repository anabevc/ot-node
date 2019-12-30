#!/bin/bash

if [[ -z "$3" ]]; then
  echo "No path supplied, using default config path."
  path="$HOME/origintrail_noderc"
else
  path=$3
fi

if [[ "$1" = "dc" ]]; then
  sed -i "s/\(\"dc_price_factor\" : \)\"[0-9]*\"/\1\"$2\"/g" "$path"
elif [[ "$1" = "dh" ]]; then
  sed -i "s/\(\"dh_price_factor\" : \)\"[0-9]*\"/\1\"$2\"/g" "$path"
fi

#docker restart otnode && docker logs otnode
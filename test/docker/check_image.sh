#!/bin/bash

set -ev
docker ps -a
docker build --file $TRAVIS_BUILD_DIR/Dockerfile.development -t myimage:latest .
docker images
# TODO make sure that following hub contract address is in .origintrail_noderc.image
cat $ARTIFACTS_DIR/truffle-migrate.log | grep "Hub contract address:"
node $TRAVIS_BUILD_DIR/test/docker/getHubAddress.js
docker run -d --name=mynode -p 8900:8900 -p 5278:5278 -p 3000:3000 --network host -v $TRAVIS_BUILD_DIR/.origintrail_noderc.image:/ot-node/.origintrail_noderc myimage:latest
# TODO make sure that one of acct-keys is in .origintrail_noderc.image
# cat $ARTIFACTS_DIR/acct-keys.log
# Give some time for node to start
sleep 180
# docker container inspect mynode
# docker network inspect host
docker exec mynode /bin/sh -c "curl -X POST http://127.0.0.1:8900/api/latest/import -F standard_id=GS1-EPCIS -F file=/importers/xml_examples/Retail/03_Pink_to_orange_shipment.xml" > $TRAVIS_BUILD_DIR/importResult.json
cat $TRAVIS_BUILD_DIR/importResult.json
# TODO better asserts that import response has one key, handler_id
grep -q 'handler_id' $TRAVIS_BUILD_DIR/importResult.json
#!/bin/bash
cd bin; ./v4srv.darwin -port=8085 -virgo=http://localhost:8080 -search=http://localhost:8090 -stubsmtp=1 \
   -jwtkey y4YrmEq2EEc4DeAf \
   -devuser=lf6f -devrole=lib-virgo4-admin \
   -ils=http://localhost:3000 \
   -cremail lf6f@virginia.edu -lawemail lf6f@virginia.edu \
   -feedbackemail lf6f@virginia.edu \
   -devkiosk=0 \
   -illiad=https://uva.hosts.atlas-sys.com/illiadwebplatform -illiadkey=3ca0f266-08a5-49a0-bf5d-013724e24821 \
   -solr=http://virgo4-solr-staging-replica-private.internal.lib.virginia.edu:8080/solr -core=test_core
#go run backend/*.go -port=8085 -virgo=http://localhost:8080 -search=http://localhost:8090 -stubsmtp=1 -devuser=nb4hm -ils=http://localhost:3000 -cremail lf6f@virginia.edu -devkiosk=0 -illiad=https://uva.hosts.atlas-sys.com/illiadwebplatform -illiadkey=3ca0f266-08a5-49a0-bf5d-013724e24821
#go run backend/*.go -port=8085 -virgo=http://localhost:8080 -search=http://localhost:8090 -stubsmtp=1 -devuser=nb4hm -ils=http://localhost:3000 -cremail lf6f@virginia.edu -devkiosk=1 -illiad=https://uva.hosts.atlas-sys.com/illiadwebplatform -illiadkey=3ca0f266-08a5-49a0-bf5d-013724e24821
# instructor: mab2cb
# instructur: sks9h
# has ILLiad request: bms8z
# has illiad digital: nb4hm
   
#-ils=https://ils-connector-dev.lib.virginia.edu \

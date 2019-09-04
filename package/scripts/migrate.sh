#!/usr/bin/env bash
#
# run any necessary migrations
#

# run the migrations
bin/migrate -path db -verbose -database postgres://$V4_DB_USER:$V4_DB_PASS@$V4_DB_HOST:$V4_DB_PORT/$V4_DB_NAME up

# return the status
exit $?

#
# end of file
#

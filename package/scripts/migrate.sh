#!/usr/bin/env bash
#
# run any necessary migrations
#

# run the migrations
bin/migrate -path db -verbose -database postgres://$DBUSER:$DBPASS@$DBHOST:$DBPORT/$DBNAME up

# return the status
exit $?

#
# end of file
#

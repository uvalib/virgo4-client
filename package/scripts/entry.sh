#!/usr/bin/env bash
#
# run application
#

# run the server
cd bin; ./v4srv -search $V4_SEARCH_API -ils $V4_ILS_API -cremail $V4_CR_EMAIL -dbhost $V4_DB_HOST -dbport $V4_DB_PORT -dbname $V4_DB_NAME -dbuser $V4_DB_USER -dbpass $V4_DB_PASS

# return the status
exit $?

#
# end of file
#

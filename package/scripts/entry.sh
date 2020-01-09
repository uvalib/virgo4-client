#!/usr/bin/env bash
#
# run application
#

# run the server
cd bin; ./v4srv -virgo $V4_URL -search $V4_SEARCH_API -ils $V4_ILS_API -smtphost $V4_SMPT_HOST -smtpport $V4_SMPT_PORT -smtpuser $V4_SMPT_USER -smtppass $V4_SMPT_PASS -smtpsender $V4_SMPT_SENDER -cremail $V4_CR_EMAIL -dbhost $V4_DB_HOST -dbport $V4_DB_PORT -dbname $V4_DB_NAME -dbuser $V4_DB_USER -dbpass $V4_DB_PASS -illiad $V4_ILLIAD_API -illiadkey $V4_ILLIAD_KEY -solr $V4_SOLR_URL -core $V4_SOLR_CORE

# return the status
exit $?

#
# end of file
#

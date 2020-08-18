#!/usr/bin/env bash
#
# run application
#

# run the server
cd bin; ./v4srv -virgo $V4_URL -citations $V4_CITATIONS -search $V4_SEARCH_API -ils $V4_ILS_API -smtphost $V4_SMPT_HOST -smtpport $V4_SMPT_PORT -smtpuser $V4_SMPT_USER -smtppass $V4_SMPT_PASS -smtpsender $V4_SMPT_SENDER -cremail $V4_CR_EMAIL -lawemail $V4_LAW_CR_EMAIL -feedbackemail $V4_FEEDBACK_EMAIL -dbhost $DBHOST -dbport $DBPORT -dbname $DBNAME -dbuser $DBUSER -dbpass $DBPASS -illiad $V4_ILLIAD_API -illiadkey $V4_ILLIAD_KEY -solr $V4_SOLR_URL -core $V4_SOLR_CORE -jwtkey $V4_JWT_KEY -hsilliad $V4_HSL_ILLIAD_URL

# return the status
exit $?

#
# end of file
#

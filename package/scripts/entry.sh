#!/usr/bin/env bash
#

# set blank options variables
SMTP_USER_OPT=""
SMTP_PASS_OPT=""

# SMTP username
if [ -n "${V4_SMPT_USER}" ]; then
   SMTP_USER_OPT="-smtpuser ${V4_SMPT_USER}"
fi

# SMTP password
if [ -n "${V4_SMPT_PASS}" ]; then
   SMTP_PASS_OPT="-smtppass ${V4_SMPT_PASS}"
fi

# uvalib-alerts base URL (optional; alerts are disabled without it)
ALERTS_URL_OPT=""
if [ -n "${V4_ALERTS_URL}" ]; then
   ALERTS_URL_OPT="-alertsurl ${V4_ALERTS_URL}"
fi

# run application

cd bin; ./v4srv \
   -virgo ${V4_URL} \
   -citations ${V4_CITATIONS} \
   -collections ${V4_COLLECTIONS} \
   -search ${V4_SEARCH_API} \
   -catalogPoolURL ${V4_CATALOG_POOL_URL} \
   -ils ${V4_ILS_API} \
   -smtphost ${V4_SMPT_HOST} \
   -smtpport ${V4_SMPT_PORT} \
   -smtpsender ${V4_SMPT_SENDER} \
   -feedbackemail ${V4_FEEDBACK_EMAIL} \
   -dbhost ${DBHOST} \
   -dbport ${DBPORT} \
   -dbname ${DBNAME} \
   -dbuser ${DBUSER} \
   -dbpass ${DBPASS} \
   -illiad ${V4_ILLIAD_API} \
   -illiadkey ${V4_ILLIAD_KEY} \
   -jwtkey ${V4_JWT_KEY} \
   -hsilliad ${V4_HSL_ILLIAD_URL} \
   -shelf ${V4_SHELF_BROWSE} \
   -suggestions ${V4_SUGGESTIONS} \
   ${SMTP_USER_OPT} \
   ${SMTP_PASS_OPT} \
   ${ALERTS_URL_OPT}

# return the status
exit $?

#
# end of file
#

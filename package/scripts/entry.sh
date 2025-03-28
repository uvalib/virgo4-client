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
   -fbkey ${V4_FB_KEY} \
   -fbdomain ${V4_FB_DOMAIN} \
   -fbdb ${V4_FB_DB} \
   -fbproject ${V4_FB_PROJECT} \
   -fbapp ${V4_FB_APP} \
   -pda ${PDA_URL} \
   -dibsurl ${DIBS_URL} \
   ${SMTP_USER_OPT} \
   ${SMTP_PASS_OPT}

# return the status
exit $?

#
# end of file
#

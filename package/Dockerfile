#
# build the target application
#
FROM public.ecr.aws/docker/library/golang:1.20-alpine3.17 as builder
RUN apk update && apk upgrade && apk add make npm yarn

# needed for the build
ARG FONT_AWESOME_TOKEN

WORKDIR /build
COPY go.mod go.sum Makefile ./
COPY backend ./backend
COPY frontend ./frontend
COPY templates ./templates
RUN make linux-full

#
# build the target container
#
FROM public.ecr.aws/docker/library/alpine:3.17

# update the packages
RUN apk update && apk upgrade && apk add bash tzdata ca-certificates curl && rm -rf /var/cache/apk/*

# Create the run user and group
RUN addgroup webservice && adduser webservice -G webservice -D

# set the timezone appropriatly
ENV TZ=UTC
RUN cp /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Specify home
ENV APP_HOME /virgo4-client
WORKDIR $APP_HOME

# Create necessary directories
RUN mkdir -p $APP_HOME $APP_HOME/bin $APP_HOME/scripts $APP_HOME/db
RUN chown -R webservice $APP_HOME && chgrp -R webservice $APP_HOME

# add the migrate tool
RUN cd $APP_HOME/bin && curl -L https://github.com/golang-migrate/migrate/releases/download/v4.15.2/migrate.linux-amd64.tar.gz | tar xvz

# port and run command
EXPOSE 8080
CMD scripts/entry.sh

# Move in necessary assets
COPY package/data/container_bash_profile /home/webservice/.profile
COPY package/scripts/entry.sh $APP_HOME/scripts/entry.sh
COPY package/scripts/migrate.sh $APP_HOME/scripts/migrate.sh
COPY backend/db/migrations/*.sql $APP_HOME/db/
COPY pendingTranslate.txt $APP_HOME/bin/pendingTranslate.txt
COPY --from=builder /build/bin/v4srv.linux $APP_HOME/bin/v4srv
COPY --from=builder /build/bin/public $APP_HOME/bin/public
COPY --from=builder /build/bin/templates $APP_HOME/bin/templates

# Ensure permissions are correct
RUN chown webservice:webservice /home/webservice/.profile $APP_HOME/scripts/entry.sh $APP_HOME/scripts/migrate.sh $APP_HOME/bin/v4srv $APP_HOME/bin/migrate $APP_HOME/bin/pendingTranslate.txt && chmod 755 /home/webservice/.profile $APP_HOME/scripts/entry.sh $APP_HOME/scripts/migrate.sh $APP_HOME/bin/v4srv $APP_HOME/bin/migrate $APP_HOME/bin/pendingTranslate.txt
RUN chown -R webservice:webservice $APP_HOME/bin/public $APP_HOME/bin/templates $APP_HOME/db && chmod -R 755 $APP_HOME/bin/templates $APP_HOME/bin/public $APP_HOME/db

# Add the build tag
ARG BUILD_TAG
RUN test -n "$BUILD_TAG" && touch $APP_HOME/buildtag.build-$BUILD_TAG || touch $APP_HOME/buildtag.build-0

# Specify the user
USER webservice

#
# end of file
#

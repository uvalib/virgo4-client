# Virgo4 client

This is a client to expose the virgo4 API functionality. It is a SPA written in Vue2
and includes a simple server written in go to serve it. 

### System Requirements

* GO version 1.12 or greater (mod required)
* Node version 12.2.0 or higher (https://nodejs.org/en/)
* NPM version 7.19 or greater

### Build Instructions

1. After clone, `cd frontend` and execute `npm install` to prepare the front end
2. Run the Makefile target `make build all` to generate binaries for linux, darwin and the front end.  All results will be in the bin directory.
3. To run locally in debug mode, be sure to set V4_CONFIG to localhost at the port you are running the back end at.

### Development Startup Instructions

1. `./bin/v4srv.darwin -search='https://VirgoSearchAPI:port' -ils http://docker1.lib.virginia.edu:8500/v2` (for MacOS)
    Starts backend go service on port 8080
    NOTE: To fake NetBadge auth locally, add this param `-devuser compute_ID` where compute_ID is any valid UVA computeID.
2. In another terminal `cd frontend` then `V4_CONFIG='http://localhost:8080' yarn serve`
    Starts a Yarn dev server with hot reloading and connects to the local go service for config.

### Database Notes

The backend of the client uses a Postgres DB for user settings/preferences. The schema is managed by 
https://github.com/golang-migrate/migrate and the scripts are in ./backend/db/migrations.

Install the migrate binary on your host system. For OSX, the easiest method is brew. Execute:

`brew install golang-migrate`.

Define your PSQL connection params in an environment variable, like this:

`export V4DB=postgres://v4user:pass@localhost:5432/virgo4?sslmode=disable`

User roles are stored in the v4_role enumerated type. To see values:

`SELECT enumlabel FROM pg_enum WHERE enumtypid = 'v4_role'::regtype ORDER BY oid;`

Run migrations like this:

`migrate -database ${V4DB} -path backend/db/migrations up`

Example migrate commads to create a migration and run one:

* `migrate create -ext sql -dir backend/db/migrations -seq update_user_auth`
* `migrate -database ${V4DB} -path backend/db/migrations/ up`

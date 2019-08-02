# Virgo4 client

This is a client to expose the virgo4 API functionality. It is a SPA written in Vue2
and includes a simple server written in go to serve it. 

### System Requirements

* GO version 1.12 or greater (mod required)
* Node version 8.11.1 or higher (https://nodejs.org/en/)
* Yarn version 1.16 or greater

### Build Instructions

1. After clone, `cd frontend` and execute `yarn install` to prepare the front end
2. Run the Makefile target `make build all` to generate binaries for linux, darwin and the front end.  All results will be in the bin directory.
3. To run locally in debug mode, be sure to set V4_CONFIG to localhost at the port you are running the back end at.

### Development Startup Instructions

1. `./bin/v4srv.darwin -search='https://VirgoSearchAPI:port' -ils http://docker1.lib.virginia.edu:8500/v2` (for MacOS)
    Starts backend go service on port 8080
    NOTE: To fake NetBadge auth locally, add this param `-devuser compute_ID` where compute_ID is any valid UVA computeID.
2. In another terminal `cd frontend` then `V4_CONFIG='http://localhost:8080' yarn serve`
    Starts a Yarn dev server with hot reloading and connects to the local go service for config.


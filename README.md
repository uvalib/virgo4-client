# Virgo4 client

This is a client to expose the virgo4 API functionality. It is a SPA written in Vue2
and includes a simple server written in go to serve it. 

### System Requirements

* GO version 1.12 or greater (mod required)
* Node version 8.11.1 or higher (https://nodejs.org/en/)
* Yarn version 1.16 or greater

### Build Instructions

1. After clone, `cd frontend` and execute `yarn install` to prepare the front end
2. Run the Makefile target `build all` to generate binaries for linux, darwin and the front end.  All results will be in the bin directory.
3. To run locally in debug mode, be sure to set V4_CONFIG to localhost at the port you are running the back end at. 

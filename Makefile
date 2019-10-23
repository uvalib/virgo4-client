GOCMD=go
GOBUILD=$(GOCMD) build
GOCLEAN=$(GOCMD) clean
GOTEST=$(GOCMD) test

build: darwin web

all: darwin linux web deploy-templates

linux-full: linux web deploy-templates

darwin-full: darwin web deploy-templates

deploy-templates:
	mkdir -p bin/
	rm -rf bin/templates
	mkdir -p bin/templates
	cp ./templates/* bin/templates

darwin:
	GOOS=darwin GOARCH=amd64 $(GOBUILD) -a -o bin/v4srv.darwin backend/*.go

web:
	mkdir -p bin/
	cd frontend/; yarn install; yarn build
	rm -rf bin/public
	mv frontend/dist bin/public

linux:
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 $(GOBUILD) -a -installsuffix cgo -o bin/v4srv.linux backend/*.go
	
clean:
	$(GOCLEAN)
	rm -rf bin

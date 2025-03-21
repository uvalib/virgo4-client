GOCMD = go
GOBUILD = $(GOCMD) build
GOCLEAN = $(GOCMD) clean
GOTEST = $(GOCMD) test
GOFMT = $(GOCMD) fmt
GOVET = $(GOCMD) vet
GOGET = $(GOCMD) get
GOMOD = $(GOCMD) mod

build: darwin web deploy-templates

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
	cd frontend && npm install && npm run build
	rm -rf bin/public
	mv frontend/dist bin/public

linux:
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 $(GOBUILD) -a -installsuffix cgo -o bin/v4srv.linux backend/*.go

clean:
	$(GOCLEAN) ./backend/...
	rm -rf bin

fmt:
	cd backend; $(GOFMT)

vet:
	cd backend; $(GOVET)

dep:
	cd frontend && npm upgrade
	$(GOGET) -u ./backend/...
	$(GOMOD) tidy
	$(GOMOD) verify

dep-web:
	cd frontend && npm upgrade

dep-svc:
	$(GOGET) -u ./backend/...
	$(GOMOD) tidy
	$(GOMOD) verify

check:
	go install honnef.co/go/tools/cmd/staticcheck
	$(HOME)/go/bin/staticcheck -checks all,-S1002,-ST1003 backend/*.go
	go install golang.org/x/tools/go/analysis/passes/shadow/cmd/shadow
	$(GOVET) -vettool=$(HOME)/go/bin/shadow ./backend/...

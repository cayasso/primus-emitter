REPORTER = spec
MAIN = index.js
GLOBAL = PrimusEmitter
FILE = primus-emitter.js

test:
	@./node_modules/.bin/mocha \
		--reporter $(REPORTER) \
		--bail

build:
	@./node_modules/.bin/browserbuild \
		--main $(MAIN) \
		--global $(GLOBAL) \
		--basepath lib/ `find lib -name '*.js'` \
		> $(FILE)

.PHONY: test build

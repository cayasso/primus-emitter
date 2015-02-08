MOCHA_OPTS = --bail --check-leaks

coverage:
	@mkdir -p coverage && node_modules/.bin/mocha $(MOCHA_OPTS) \
		--require blanket --reporter html-cov > coverage/coverage.html

test:
	@node_modules/.bin/mocha $(MOCHA_OPTS)

test-travis: test
	@mkdir -p coverage && node_modules/.bin/mocha $(MOCHA_OPTS) \
		--require blanket --reporter mocha-lcov-reporter > coverage/lcov.info

.PHONY: coverage test test-travis

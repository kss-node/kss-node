test:
	mocha -u tdd --reporter spec

gh-pages:
	./bin/kss-node demo gh-pages -l demo/styles.less

.PHONY: test
.PHONY: gh-pages

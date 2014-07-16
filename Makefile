test:
	./node_modules/mocha/bin/mocha -u tdd --reporter spec

gh-pages:
	./bin/kss-node demo gh-pages -l demo/styles.less --xdemo

.PHONY: test
.PHONY: gh-pages

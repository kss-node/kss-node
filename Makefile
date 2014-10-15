test:
	./node_modules/mocha/bin/mocha -u tdd --reporter spec

gh-pages:
	./bin/kss-node demo gh-pages --css demo/styles.css --xdemo

.PHONY: test
.PHONY: gh-pages

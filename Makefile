test:
	mocha -u tdd --reporter spec

gh-pages:
	node ./bin/kss-node demo gh-pages -l demo/styles.less --xdemo

.PHONY: test
.PHONY: gh-pages

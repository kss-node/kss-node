test:
	./node_modules/mocha/bin/mocha -u tdd --reporter spec

gh-pages:
	if [[ ! -e ./lib/template/node_modules/.bin/lessc ]]; then cd lib/template && npm install; fi
	cd lib/template && npm run-script less
	./bin/kss-node demo gh-pages --xdemo
	cp demo/styles.css gh-pages/public/styles.css

.PHONY: test
.PHONY: gh-pages

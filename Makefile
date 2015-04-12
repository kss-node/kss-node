test:
	./node_modules/mocha/bin/mocha -u tdd --reporter spec

gh-pages:
	if [[ ! -e ./generator/handlebars/template/node_modules/.bin/lessc ]]; then cd generator/handlebars/template && npm install; fi
	cd generator/handlebars/template && npm run-script less
	./bin/kss-node --config demo/config.json --xdemo
	cp demo/styles.css gh-pages/public/styles.css

.PHONY: test
.PHONY: gh-pages

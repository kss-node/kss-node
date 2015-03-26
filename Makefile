test:
	./node_modules/mocha/bin/mocha -u tdd --reporter spec

gh-pages:
	if [[ ! -e ./generators/handlebars/template/node_modules/.bin/lessc ]]; then cd generators/handlebars/template && npm install; fi
	cd generators/handlebars/template && npm run-script less
	./bin/kss-node --config demo/config.json --xdemo
	cp demo/styles.css gh-pages/public/styles.css

.PHONY: test
.PHONY: gh-pages

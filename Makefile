test:
	./node_modules/mocha/bin/mocha -u tdd --reporter spec

gh-pages:
	if [[ ! -e ./lib/template/node_modules/.bin/lessc ]]; then cd lib/template && npm install; fi
	cd lib/template && npm run-script less
	./bin/kss-node demo gh-pages --xdemo
	cp demo/styles.css gh-pages/public/styles.css

docs:
	echo && echo "Generating JavaScript documentation with jsdoc…" && echo
	rm -r ./gh-pages/api/master
	./node_modules/.bin/jsdoc --configure ./gh-pages/api-jsdoc-conf.json
	echo
	./node_modules/.bin/jsdoc --configure ./gh-pages/api-jsdoc-conf.json --destination ./gh-pages/api/master/internals/ --readme ./gh-pages/api-internals.md --access all

.PHONY: test
.PHONY: gh-pages
.PHONY: docs

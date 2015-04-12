docs:
	if [[ ! -e ./generator/handlebars/template/node_modules/.bin/lessc ]]; then cd generator/handlebars/template && npm install; fi
	cd generator/handlebars/template && npm run-script less
	./bin/kss-node --config demo/config.json --xdemo
	cp demo/styles.css gh-pages/public/styles.css
	echo && echo "Generating JavaScript documentation with jsdoc…" && echo
	rm -r ./gh-pages/api/master
	./node_modules/.bin/jsdoc --configure ./gh-pages/api-jsdoc-conf.json
	echo
	./node_modules/.bin/jsdoc --configure ./gh-pages/api-jsdoc-conf.json --destination ./gh-pages/api/master/internals/ --readme ./gh-pages/api-internals.md --access all

.PHONY: docs

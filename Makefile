docs:
	if [[ ! -e ./generator/handlebars/template/node_modules/.bin/lessc ]]; then cd generator/handlebars/template && npm install; fi
	cd generator/handlebars/template && npm run-script less
	./bin/kss-node --destination gh-pages --xdemo
	cp demo/styles.css gh-pages/public/styles.css
	echo && echo "Generating JavaScript documentation with jsdoc…" && echo
	rm -r ./gh-pages/api/master
	./node_modules/.bin/jsdoc --configure ./gh-pages/api-jsdoc-conf.json
	echo
	./node_modules/.bin/jsdoc --configure ./gh-pages/api-jsdoc-conf.json --destination ./gh-pages/api/master/internals/ --readme ./gh-pages/api-internals.md --access all
	for HTMLDOC in ./gh-pages/api/*/**.html; do cat $$HTMLDOC | sed 's/<title>JSDoc: /<title>kss-node JavaScript API: /' > $$HTMLDOC.tmp; mv $$HTMLDOC.tmp $$HTMLDOC; done

.PHONY: docs

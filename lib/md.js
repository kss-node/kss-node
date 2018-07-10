'use strict';

const hljs = require('highlight.js'); // https://highlightjs.org/
const MarkdownIt = require('markdown-it');

/**
 * `md` is the kss’s markdown engine.
 *
 * It’s an intance of [Markdown-it](https://github.com/markdown-it/markdown-it)
 */
const md = new MarkdownIt({
  html: true, // Enable HTML tags in source
  highlight: function(str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre class="hljs"><code class="language-${lang}">${hljs.highlight(lang, str, true).value}</code></pre>`;
      } catch (e) {
        // higllight fail
      }
    }

    return `<pre class="hljs"><code class="language-${lang}">${md.utils.escapeHtml(str)}</code></pre>`;
  }
});

module.exports = md;

# Building style guides with kss-node

This software is a Node.js implementation of [Knyle Style Sheets](https://github.com/kneath/kss) (KSS), "a documentation syntax for CSS" that's intended to have syntax readable by humans *and* machines. Hence, the kss-node software can be used to create a "living style guide".

1. Write human-readable documentation using "KSS syntax" comments. Can be added to CSS, Sass, LESS, or any other CSS Preprocessor files.
2. Have `kss-node` auto-generate a style guide from your stylesheets.

Here's an example KSS comment:
<pre class="prettyprint linenums lang-css"><code data-language="css">/*
Button

Your standard button suitable for clicking.

:hover   - Highlights when hovering.
.shiny   - Do not press this big, shiny, red button.

Style guide: components.button
*/
.button {
  ...
}
.button.shiny {
  ...
}
</code></pre>

**For more information on how to write KSS comments, see the [KSS spec](https://github.com/kss-node/kss/blob/spec/SPEC.md).**

## kss-node demo

This site is generated with the `kss-node` command-line tool and parses the KSS documentation found in this [demo project](https://github.com/kss-node/kss-node/tree/master/demo).

The styling of this site is a demo of [kss-node](https://github.com/kss-node/kss-node)'s default style guide generator. By using the site navigation to the left (or above), you can see how your documentation would look with the default generator. Note that alternate generators are available.

## JavaScript API

If you don't wish to use the default style guide template, you can either:
* write your own template that uses the default kssHandlebarsGenerator style guide generator, or
* write your own style guide generator, or
* use the JavaScript object representation of the style guide, KssStyleguide.

**For more information on how to integrate kss-node with your own JavaScript, see the [JavaScript API documentation](./section-javascript-api.html).**

## Project homepage

Check out the [project on Github](https://github.com/kss-node/kss-node) for more information about the code.

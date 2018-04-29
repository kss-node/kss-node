# Building style guides with kss-node

This software is a Node.js implementation of [Knyle Style Sheets](https://github.com/kneath/kss) (KSS), "a documentation syntax for CSS" that's intended to have syntax readable by humans *and* machines. Hence, the kss-node software can be used to create a "living style guide".

1. Write human-readable documentation using "KSS syntax" comments. Can be added to CSS, Sass, LESS, or any other CSS Preprocessor files.
2. Have the `kss` tool automatically build a style guide from your stylesheets.

Here's an example KSS comment:
```css
/*
Button

Your standard button suitable for clicking.

:hover   - Highlights when hovering.
.shiny   - Do not press this big, shiny, red button.

Markup: button.html

Style guide: components.button
*/
.button {
  /* … */
}
.button.shiny {
  /* … */
}
```

**For more information on how to write KSS comments, see the [KSS spec](https://github.com/kss-node/kss/blob/spec/SPEC.md).**

## kss demo

This site is built with the `kss` command-line tool and parses the KSS documentation found in this [demo project](https://github.com/kss-node/kss-node/tree/master/demo).

The styling of this site is a demo of [kss-node](https://github.com/kss-node/kss-node)'s default style guide builder. By using the site navigation to the left (or above), you can see how your documentation would look with the default builder. Note that alternate builders are available.

## Quick start guide

Documentation on how to get started with kss-node (and with Node.js' npm) is available on the [kss-node wiki](https://github.com/kss-node/kss-node/wiki).

## JavaScript API

If you don't wish to use the default style guide builder, you can either:
* write your own builder that uses the KssBuilderBaseHandlebars class, or
* write your own builder and class that extends KssBuilderBase, or
* use the JavaScript object representation of the style guide, KssStyleGuide.

**For more information on how to integrate kss-node with your own JavaScript, see the [JavaScript API documentation](./section-javascript-api.html).**

## Project homepage

Check out the [project on Github](https://github.com/kss-node/kss-node) for more information about the code.

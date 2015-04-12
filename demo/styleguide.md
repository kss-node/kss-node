# Overview

This software is a Node.js implementation of [Knyle Style Sheets](https://github.com/kneath/kss) (KSS), "a documentation syntax for CSS" that's intended to have syntax readable by humans *and* machines. Hence, the kss-node software can be used to create a "living style guide".

1. Write human-readable documentation using "KSS syntax" comments. Can be added to CSS, Sass, LESS, or any other CSS Preprocessor files.
2. Have `kss-node` auto-generate a style guide from your stylesheets.

Here's an example KSS comment:
```css
/*
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
```

# kss-node demo

This site is generated with the `kss-node` command-line tool and parses the KSS documentation found in this [demo project](https://github.com/kss-node/kss-node/tree/master/demo).

The styling of this site is a demo of [kss-node](https://github.com/kss-node/kss-node)'s default style guide generator. By using the site navigation to the left (or above), you can see how your documentation would look with the default generator. Note that alternate generators are available.

# KSS Specification

Read the KSS spec for details on how to document your stylesheets.

Compared to the default Ruby implementation at kneath/kss, kss-node includes a few optional features to allow for completely automated style guide generation out of the box. The kss-node specifics are detailed in this annotated copy of the [KSS spec](https://github.com/kss-node/kss/blob/spec/SPEC.md).

# JavaScript API

If you don't wish to use the default style guide template, you can either:
* write your own template that uses the default kssHandlebarsGenerator style guide generator, or
* write your own style guide generator, or
* use the JavaScript object representation of the style guide, KssStyleguide

The JavaScript API documentation is available for many versions of kss-node:
* [kss-node master branch](./api/master/) (future 2.1.x version)
* ~~[kss-node v2.0.x](./api/2.0.x/)~~ Available soon.

# Project homepage

Check out the [project on Github](https://github.com/kss-node/kss-node) for more information about the code.

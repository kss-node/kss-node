[![Build Status](https://secure.travis-ci.org/kss-node/kss-node.png?branch=master)](http://travis-ci.org/kss-node/kss-node/builds) [![Coverage Status](https://coveralls.io/repos/kss-node/kss-node/badge.svg?branch=master&service=github)](https://coveralls.io/github/kss-node/kss-node?branch=master) [![Dependency Status](https://david-dm.org/kss-node/kss-node.svg)](https://david-dm.org/kss-node/kss-node)

**Note:** This README is for the `master` branch of this project. To see the README for the latest stable release see [https://www.npmjs.com/package/kss](https://www.npmjs.com/package/kss).

# kss-node

[![Greenkeeper badge](https://badges.greenkeeper.io/kss-node/kss-node.svg)](https://greenkeeper.io/)

This is a Node.js implementation of [KSS](https://github.com/kneath/kss), "a documentation syntax for CSS" that's intended to have syntax readable by humans *and* machines. Hence, the kss-node software can be used to create a "living style guide".

1. Write human-readable documentation using "KSS syntax" comments.
2. Have the `kss` tool automatically build a style guide from your stylesheets.

Here's an example KSS comment:
```scss
// Button
//
// Your standard button suitable for clicking.
//
// :hover   - Highlights when hovering.
// .shiny   - Do not press this big, shiny, red button.
//
// Markup: button.html
//
// Style guide: components.button
.button {
  ...
}
.button.shiny {
  ...
}
```

The methodology and ideas behind KSS are contained in [the specification](https://github.com/kss-node/kss/blob/spec/SPEC.md).

There's an example project in the [demo directory](https://github.com/kss-node/kss-node/tree/master/demo) of this repo.

## What does KSS mean?

KSS was originally named "Knyle Style Sheets" to be a pun on CSS and the software creator’s name, Kyle Neath. We are working on a better acronym.

## Installation

kss-node is installed just like any other Node.js software. Read the [kss-node Quick Start Guide](https://github.com/kss-node/kss-node/wiki/Quick-Start-Guide) to learn more. It also includes an npm Quick Start Guide, if you don't know much about Node.js's npm command.

## Using the command line tool

To get you up and running quickly, a style guide builder is included that can be used from the command line. It parses stylesheets and spits out a set of static HTML files.

```
Usage: kss [options]

File locations:
  --source       Source directory or wildcard to recursively parse for KSS
                 comments, homepage, and markup                         [string]
  --base         Base directory, used to resolve sources, homepage, etc.
                            [string] [default: "/Users/yliechti/Sites/kss-node"]
  --destination  Destination directory of style guide
                                                [string] [default: "styleguide"]
  --json         Output a JSON object instead of building a style guide[boolean]
  --mask, -m     Use a mask for detecting files containing KSS comments
                [string] [default: "*.css|*.less|*.sass|*.scss|*.styl|*.stylus"]
  --config, -c   Load the kss options from a json file

Builder:
  --clone        Clone a style guide builder to customize               [string]
  --builder, -b  Use the specified builder when building your style guide
                                        [string] [default: "builder/handlebars"]

Style guide:
  --css          URL of a CSS file to include in the style guide        [string]
  --js           URL of a JavaScript file to include in the style guide [string]
  --custom       Process a custom property name when parsing KSS comments
                                                                        [string]
  --extend       Location of modules to extend the templating system; see
                 http://bit.ly/kss-wiki                                 [string]
  --homepage     File name of the homepage’s Markdown file related to working
                 directory
                [string] [default: "/Users/yliechti/Sites/kss-node/homepage.md"]
  --markup       Render "markup" templates to HTML with the placeholder text
                                                      [boolean] [default: false]
  --placeholder  Placeholder text to use for modifier classes
                                          [string] [default: "[modifier class]"]
  --nav-depth    Limit the navigation to the depth specified        [default: 3]

Options:
  --help     Show help                                                 [boolean]
  --version  Show version number                                       [boolean]
  --verbose  Display verbose details while building                      [count]
  --demo     Builds a KSS demo.                       [boolean] [default: false]
  --//       Comments in JSON files will be ignored
```

Since each builder has its own set of options, you can see the help for those options by using `--builder` with `--help`. For example, running `kss --help --builder builder/twig` will show these additional options:

```
Style guide:
  --extend-drupal8  Extend Twig.js using kss’s Drupal 8 extensions
  --namespace       Adds a Twig namespace, given the formatted string:
                    "namespace:path"
```

In order to parse your stylesheets containing KSS docs, you need to either specify a single directory as the first argument or you can specify one or more source directories with one or more `--source [directory]` flags.

The style guide will be built in the `styleguide` directory unless you specify the second argument or use a `--destination [directory]` flag.

Even though kss parses your CSS source, your CSS won't be included in the style guide unless you use the `--css` option or create a custom builder with `--clone`.

You can build a copy of the demo style guide like so:

    $ kss --demo

If you want to change the HTML of the style guide being built, you can create your own builder, i.e. skin, theme. Use the `kss --clone` command to initialize a copy of the default builder so you can edit it and use it when building your style guide with the `--builder` flag.

    $ kss --clone custom-builder
    $ kss path/to/sass styleguide --builder custom-builder

The default builder should look something like this:

![Handlebars Builder Preview](https://raw.github.com/kss-node/kss-node/master/demo/preview.png)

## Differences from kneath/kss

Unlike the default Ruby implementation at kneath/kss, kss-node includes a few optional features to allow for completely automated style guide building.

**Language Agnostic**. kss-node does not care what language your application is written in (Ruby, Node.js, PHP, whatever). It just scans your CSS source files looking for KSS docs so that it can build a living style guide. And since it only looks for properly formatted KSS comments, it also doesn't need to know what kind of CSS preprocessor you use either.

**Homepage Text**. The overview text needed for the style guide homepage is built from a Markdown file. The file path must be relative to config file or working directory if given by command line. Just name it `homepage.md` and put it in directory of config file.

Additional kss-node specifics are detailed in this version of the [KSS spec](https://github.com/kss-node/kss/blob/spec/SPEC.md).

Take a look at the [demo project](https://github.com/kss-node/kss-node/tree/master/demo) for some examples.

## Using kss from Node.js

Check out the [JavaScript API](http://kss-node.github.io/kss-node/section-javascript-api.html) for a full explanation. Here's an example:

``` javascript
var kss = require('kss'),
    options = {
        markdown: false
    };

kss.traverse('public/stylesheets/', options).then(function(styleGuide) {
    styleGuide.sections('2.1.1');                                   // <KssSection>
    styleGuide.sections('2.1.1').modifiers(0);                      // <KssModifier>
    styleGuide.sections('2.1.1').modifiers(':hover').description(); // 'Subtle hover highlight'
    styleGuide.sections('2.1.1').modifiers(0).className();          // 'pseudo-class-hover'
    styleGuide.sections('2.x.x');                                   // [<KssSection>, ...]
    styleGuide.sections('2.1.1').modifiers();                       // [<KssModifier>, ...]
});
```

## Development

Forking, hacking, and tearing apart of this software is welcome! It still needs some cleaning up.

After you've cloned this repository, run `npm install` and then you'll be able to run the module's mocha and eslint tests with `npm test`.

To build a new version of the demo style guide and JavaScript documentation, use `make docs` and commit your changes to master. To publish the documentation to http://kss-node.github.io/kss-node/ , run `npm run docs-deploy`.

## Contributors

Lots! And more are welcome. https://github.com/kss-node/kss-node/graphs/contributors

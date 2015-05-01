[![Build Status](https://secure.travis-ci.org/kss-node/kss-node.png?branch=master)](http://travis-ci.org/kss-node/kss-node)

# kss-node

This is a Node.js implementation of [Knyle Style Sheets](https://github.com/kneath/kss) (KSS), "a documentation syntax for CSS" that's intended to have syntax readable by humans *and* machines. Hence, the kss-node software can be used to create a "living style guide".

1. Write human-readable documentation using "KSS syntax" comments.
2. Have `kss-node` auto-generate a style guide from your stylesheets.

Here's an example KSS comment:
```scss
// Button
//
// Your standard button suitable for clicking.
//
// :hover   - Highlights when hovering.
// .shiny   - Do not press this big, shiny, red button.
//
// Style guide: components.button
.button {
  ...
}
.button.shiny {
  ...
}
```

The methodology and ideas behind Knyle Style Sheets are contained in [the specification](https://github.com/kss-node/kss/blob/spec/SPEC.md).

There's an example project in the [demo directory](https://github.com/kss-node/kss-node/tree/master/demo) of this repo.

## Installation

Just one line: `npm install kss`. Or, if you have a package.json for your project, with: `npm install kss --save-dev`.

After that, the command line tool can be found at `./node_modules/bin/kss-node`.

If you know what you are doing, you can install it globally with: `npm install -g kss`

## Using the CLI

To get you up and running quickly, a style guide generator is included that can be used from the command line. It parses stylesheets and spits out a set of static HTML files.

```
Usage: kss-node <source> [destination] [options]

Options:
  --init, -i      Create a new style guide template to customize
                                                [default: "styleguide-template"]
  --template, -t  Use a custom template to build your style guide
                                                       [default: "lib/template"]
  --helpers       Specify the location of custom handlebars helpers; see
                  http://bit.ly/kss-helpers    [default: "lib/template/helpers"]
  --mask, -m      Use a mask for detecting files containing KSS comments
                         [default: "*.css|*.less|*.sass|*.scss|*.styl|*.stylus"]
  --custom        Process a custom property name when parsing KSS comments

  --css           Specify the URL of a CSS file to include in the style guide
  --js            Specify the URL of a JavaScript file to include in the style
                  guide

  --source        Source directory to parse for KSS comments
  --destination   Destination directory of generated style guide
                                                         [default: "styleguide"]

  --config, -c    Load the kss-node configuration from a json file

  --version       Show version number
  --help, -h, -?  Show help
```

In order to parse your stylesheets containing KSS docs, you need to either specify a single directory as the first argument or you can specify one or more source directories with one or more `--source [directory]` flags.

The generated style guide will be put into the `styleguide` directory unless you specify the second argument or use a `--destination [directory]` flag.

Even though kss-node parses your CSS source, your CSS won't be included in the style guide unless you use the `--css` option or create a custom template with `--init`.

You can generate a copy of the demo style guide like so:

    $ kss-node --xdemo

It is recommended that you create your own template, i.e. skin, theme. Use the `kss-node --init` command to initialize a copy of the default template so you can edit it and use it when generating your style guide with the `--template` flag. Simply link the generated CSS (as well as JS, etc.) from inside the custom template's index.html.

    $ kss-node --init custom-template
    $ kss-node path/to/sass styleguide --template custom-template

The default template should look something like this:

![CLI Template Preview](https://raw.github.com/kss-node/kss-node/master/demo/preview.png)

## Differences from kneath/kss

Unlike the default Ruby implementation at kneath/kss, kss-node includes a few optional features to allow for completely automated style guide generation.

**Language Agnostic**. kss-node does not care what language your application is written in (Ruby, Node.js, PHP, whatever). It just scans your CSS source files looking for KSS docs so that it can generate a living style guide. And since it only looks for properly formatted KSS comments, it also doesn't need to know what kind of CSS preprocessor you use either.

**Homepage Text**. The overview text needed for the style guide homepage is generated from a Markdown file, which you should place in a `--source` directory, just name it `styleguide.md` and it will be included in the final style guide automatically.

Additional kss-node specifics are detailed in this version of the [KSS spec](https://github.com/kss-node/kss/blob/spec/SPEC.md).

Take a look at the [demo project](https://github.com/kss-node/kss-node/tree/master/demo) for some examples.

## Using kss-node from Node.js

Check out the [Module API](https://github.com/kss-node/kss-node/wiki/Module-API) for a full explanation. Here's an example:

``` javascript
var kss = require('kss'),
    options = {
        markdown: false
    };

kss.traverse('public/stylesheets/', options, function(err, styleguide) {
    if (err) throw err;

    styleguide.section('2.1.1')                                   // <KssSection>
    styleguide.section('2.1.1').modifiers(0)                      // <KssModifier>
    styleguide.section('2.1.1').modifiers(':hover').description() // 'Subtle hover highlight'
    styleguide.section('2.1.1').modifiers(0).className()          // 'pseudo-class-hover'
    styleguide.section('2.x.x')                                   // [<KssSection>, ...]
    styleguide.section('2.1.1').modifiers()                       // [<KssModifier>, ...]
});
```

## Development

Forking, hacking, and tearing apart of this software is welcome! It still needs some cleaning up.

If you've got [mocha](https://github.com/visionmedia/mocha) installed, you can run the module's tests with `npm test` or `make test`.

To generate a new version of the demo style guide, use `make gh-pages`. After committing your changes to master you can use the `gh-pages.sh` script to move this over to the `gh-pages` branch real quick.

## Contributors

Lots! And more are welcome. https://github.com/kss-node/kss-node/graphs/contributors

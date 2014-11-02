# kss-node [![Build Status](https://secure.travis-ci.org/kss-node/kss-node.png?branch=master)](http://travis-ci.org/kss-node/kss-node)

This is a NodeJS implementation of [Knyle Style Sheets](https://github.com/kneath/kss) (KSS), "a documentation syntax for CSS". Beyond that, it's intended to have syntax readable by humans *and* machines - hence, this module can be used to create a "living styleguide". The methodology and ideas behind Knyle Style Sheets are contained in [the specification](https://github.com/kneath/kss/blob/master/SPEC.md).

There's an example project in the [demo directory](https://github.com/kss-node/kss-node/tree/master/demo) of this repo.

## Installation

Just one line: `npm install kss`. If you want to use the command line interface, make sure the installation is global: `npm install -g kss`

## Using the CLI

To get you up and running quickly, a styleguide generator is included that can be used from the command line. It parses a directory of stylesheets and spits out a set of static HTML files like the ones used on this site.

```
Usage: kss-node <source> [destination] [options]

Options:
  --init, -i      Create a new styleguide template to customize
                                                [default: "styleguide-template"]
  --template, -t  Use a custom template to build your styleguide
                                                       [default: "lib/template"]
  --helpers       Specify the location of custom handlebars helpers; see
                  http://bit.ly/kss-helpers    [default: "lib/template/helpers"]
  --mask, -m      Use a mask for detecting files containing KSS comments
                         [default: "*.css|*.less|*.sass|*.scss|*.styl|*.stylus"]
  --css, -s       Copies CSS stylesheets into the styleguide; WARNING: relative
                  paths are not rewritten

  --source        Source directory to parse for KSS comments
  --destination   Destination directory of generated styleguide
                                                         [default: "styleguide"]

  --config, -c    Load the kss-node configuration from a json file

  --version       Show version number
  --help, -h, -?  Show help
```

You'll need to specify a directory containing all of your stylesheet files to be parsed for documentation as the first argument. Optionally, the second argument can be used to specify a target directory. Your CSS won't be included by default, howerver, unless you use the inflexible `--css` option or create a flexible custom template with `--init`. You can generate a copy of the demo styleguide like so:

    $ kss-node --xdemo

It is recommended that you create your own template, i.e. skin, theme. Use the `kss-node --init` command to initialize a copy of the default template so you can edit it and use it when generating your styleguide with the `--template` flag. Simply link the generated CSS from inside the custom template's index.html.

    $ kss-node --init custom-template
    $ kss-node path/to/sass styleguide --template custom-template

The default template should look something like this:

![CLI Template Preview](https://raw.github.com/kss-node/kss-node/master/demo/preview.png)

## Using kss-node from Node

Check out the [Module API](https://github.com/kss-node/kss-node/wiki/Module-API) a full explanation. Here's an example:

``` javascript
var kss = require('kss'),
    options = {
        markdown: false
    };

kss.traverse('public/stylesheets/', options, function(err, styleguide) {
    if (err) throw err;

    styleguide.section('2.1.1')                                   // <KssSection>
    styleguide.section('2.1.1').description()                     // A button suitable for giving stars to someone
    styleguide.section('2.1.1').modifiers(0)                      // <KssModifier>
    styleguide.section('2.1.1').modifiers(0).name                 // ':hover'
    styleguide.section('2.1.1').modifiers(0).description          // 'Subtle hover highlight'
    styleguide.section('2.1.1').modifiers(':hover').description() // 'Subtle hover highlight'
    styleguide.section('2.1.1').modifiers(0).className()          // 'pseudo-class-hover'
    styleguide.section('2.x.x')                                   // [<KssSection>, ...]
    styleguide.section('2.1.1').modifiers()                       // [<KssModifier>, ...]
});
```

## Differences

Included are a few additional (optional) features to allow for completely automated styleguide generation.

Take a look at the [demo project](https://github.com/kss-node/kss-node/tree/master/demo) for some examples.

*Overview Document**. This "overview" page is generated from a Markdown file, which you should place in the directory you're generating from, just name it `styleguide.md` and it will be included in the final styleguide automatically.

**HTML Markup**. In `kss-node` you can include sample markup in your styleguide entries. This is not only helpful for newcomers to a project, but is also used by the generator to include samples in your styleguide - just start a paragraph in your description section with `Markup:` like so:

``` javascript
// Button
//
// Buttons can and should be clicked.
//
// Markup: <button class="button {{modifier_class}}">
//
// :hover - Highlight the button when hovered.
//
// Styleguide 1.1
```

Alternatively, you can point at a separate file that contains your HTML. Either a plain *.html file or a Handlebars *.hbs file.

``` javascript
// Button
//
// Markup: button.hbs
//
// Styleguide 1.1
```

**Multi-line descriptions**. You can run your descriptions over multiple lines and paragraphs, and if you don't want to include the "modifiers" section you don't have to.

## Development

Forking, hacking, tearing apart of this module welcome - it still needs some cleaning up.

If you've got [mocha](https://github.com/visionmedia/mocha) installed, you can run the module's tests with `npm test` or `make test`.

To generate a new version of the demo styleguide, use `make gh-pages`. After committing your changes to master you can use the `gh-pages.sh` script to move this over to the `gh-pages` branch real quick.

## Contributors

* [John Albin Wilkins](https://github.com/JohnAlbin)
* [Warin](https://github.com/Warin)
* [Manuel Goerlich](https://github.com/MaThGo)
* [Kevin Lamping](https://github.com/klamping)

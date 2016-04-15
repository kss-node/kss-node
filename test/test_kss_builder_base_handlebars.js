/* eslint-disable max-nested-callbacks */

'use strict';

const KssBuilderBase = require('../builder/base'),
  KssBuilderBaseHandlebars = require('../builder/base/handlebars'),
  mockStream = require('mock-utf8-stream');

const testBuilder = function(options) {
  options = options || {};

  let builder = new KssBuilderBaseHandlebars();

  // For our tests, feed kss() log functions that mock stdout and stderr so we
  // can capture the output easier.
  options.testStreams = {};
  options.testStreams.stdout = new mockStream.MockWritableStream();
  options.testStreams.stderr = new mockStream.MockWritableStream();
  options.testStreams.stdout.startCapture();
  options.testStreams.stderr.startCapture();
  options.logFunction = function() {
    let message = '';
    for (let i = 0; i < arguments.length; i++) {
      message += arguments[i];
    }
    options.testStreams.stdout.write(message + '\n');
  };
  options.logErrorFunction = function(error) {
    // Show the full error stack if the verbose option is used twice or more.
    options.testStreams.stderr.write(((error.stack && options.verbose > 1) ? error.stack : error) + '\n');
  };

  builder.addOptions(options);

  builder.getTestOutput = function(pipe) {
    let streams = this.getOptions('testStreams');

    if (typeof pipe === 'undefined') {
      return {
        stdout: streams.stdout.capturedData,
        stderr: streams.stderr.capturedData
      };
    } else {
      return streams[pipe].capturedData;
    }
  };

  return builder;
};

describe('KssBuilderBaseHandlebars object API', function() {
  before(function() {
    this.files = {};
    let source = helperUtils.fixtures('source-handlebars-builder-test'),
      destination = path.resolve(__dirname, 'output', 'base_handlebars', 'build');
    this.builder = testBuilder({
      source: source,
      destination: destination,
      builder: helperUtils.fixtures('builder-with-assets'),
      helpers: helperUtils.fixtures('builder-with-assets', 'helpers'),
      css: ['styles-1.css', 'styles-2.css'],
      js: ['javascript-1.js', 'javascript-2.js'],
      verbose: true
    });
    return kss.traverse(source).then(styleGuide => {
      return this.builder.prepare(styleGuide);
    }).then(styleGuide => {
      return this.builder.build(styleGuide);
    }).then(() => {
      return Promise.all(
        [
          'index',
          'section-1',
          'section-2',
          'section-3'
        ].map(fileName => {
          return fs.readFileAsync(path.join(__dirname, 'output', 'base_handlebars', 'build', fileName + '.html'), 'utf8').then(data => {
            this.files[fileName] = data;
          });
        })
      );
    });
  });

  describe('KssBuilderBaseHandlebars constructor', function() {
    it('should create an instance of KssBuilderBase', function() {
      const builder = new KssBuilderBaseHandlebars();
      expect(builder).to.be.instanceOf(KssBuilderBaseHandlebars);
      expect(builder).to.be.instanceOf(KssBuilderBase);
    });

    it('should set the proper API version', function() {
      let builder = new KssBuilderBaseHandlebars();
      expect(builder.API).to.equal('3.0');
    });

    it('should implement the default option definitions', function() {
      let builder = new KssBuilderBaseHandlebars();
      expect(Object.getOwnPropertyNames(builder.optionDefinitions)).to.deep.equal(['source', 'destination', 'mask', 'clone', 'builder', 'css', 'js', 'custom', 'verbose', 'helpers', 'homepage', 'placeholder', 'nav-depth']);
    });
  });

  /* eslint-disable guard-for-in,no-loop-func */
  ['createMenu',
    'buildPage'
  ].forEach(function(method) {
    it('implements ' + method + '() method', function() {
      expect((new KssBuilderBaseHandlebars())).to.respondTo(method);
    });
  });
  /* eslint-enable guard-for-in,no-loop-func */

  describe('.prepare', function() {
    before(function() {
      this.builderPrepared = testBuilder({
        destination: path.resolve(__dirname, 'output', 'base_handlebars', 'prepare'),
        builder: helperUtils.fixtures('builder-with-assets'),
        helpers: [helperUtils.fixtures('builder-with-assets', 'helpers')]
      });
      return this.builderPrepared.prepare(new kss.KssStyleGuide({sections: [{header: 'Section 1', reference: 'one'}]}));
    });

    after(function() {
      return fs.removeAsync(path.resolve(__dirname, 'output', 'base_handlebars', 'prepare'));
    });

    it('stores the global Handlebars object', function() {
      expect(this.builderPrepared).to.have.property('Handlebars');
      expect(this.builderPrepared.Handlebars).to.be.object;
    });

    it('loads the standard Handlebars helpers', function() {
      expect(this.builderPrepared.Handlebars.helpers).to.have.property('markup');
    });

    it('outputs settings if the verbose option is set', function() {
      let builder = testBuilder({
        helpers: ['/dev/null/example1', '/dev/null/example2'],
        verbose: true,
        // Force early prepare() failure.
        destination: null
      });
      return builder.prepare(new kss.KssStyleGuide({sections: [{header: 'Section 1', reference: 'one'}]})).catch(error => {
        let output = builder.getTestOutput('stdout');
        expect(output).to.contain('Building your KSS style guide!');
        expect(output).to.contain(' * Helpers     : /dev/null/example1, /dev/null/example2');
        return error;
      }).then(error => {
        expect(error.message).to.equal('Path must be a string. Received null');
      });
    });

    it('makes a kss-assets directory', function() {
      return fs.readdirAsync(path.resolve(__dirname, 'output', 'base_handlebars', 'prepare', 'kss-assets')).then(directoryListing => {
        expect(directoryListing).to.deep.equal(['asset1.js', 'asset2.css']);
      });
    });

    it('loads optional helpers', function() {
      expect(this.builderPrepared.Handlebars.helpers.test).to.exist;
    });

    it('compiles the Handlebars template', function() {
      expect(this.builderPrepared.template).to.be.function;
    });
  });

  describe('.build', function() {
    it('should save the KssStyleGuide', function() {
      let styleGuide = new kss.KssStyleGuide({
        sections: [
          {header: 'Section A'},
          {header: 'Section B'}
        ]
      });
      let builder = testBuilder();
      return builder.build(styleGuide).catch(error => {
        return error;
      }).then(() => {
        expect(builder.styleGuide).to.deep.equal(styleGuide);
      });
    });

    it('should list the files parsed if the verbose option is set', function() {
      let stdout = this.builder.getTestOutput('stdout');
      expect(stdout).to.include(' - ' + helperUtils.fixtures('source-handlebars-builder-test/kss-source.scss'));
      expect(stdout).to.include(' - ' + helperUtils.fixtures('source-handlebars-builder-test/kss-source-3.scss'));
    });

    it('should list the partials found if the verbose option is set', function() {
      let stdout = this.builder.getTestOutput('stdout');
      expect(stdout).to.include(' - 1.B: inline markup');
      expect(stdout).to.include(' - 1.E: inline markup');
      expect(stdout).to.include(' - 1.C: 1c.hbs');
    });

    it('should register the partials', function() {
      expect(this.builder.Handlebars.partials).to.have.property('1.B');
      expect(this.builder.Handlebars.partials).to.have.property('1.E');
      expect(this.builder.Handlebars.partials).to.have.property('missing-file');
      expect(this.builder.Handlebars.partials).to.have.property('1c');
      expect(Object.keys(this.builder.partials)).to.deep.equal(['1.B', '1.E', '1.D', '1.C']);
    });

    it('should note missing partials', function() {
      let stdout = this.builder.getTestOutput('stdout');
      expect(stdout).to.include(' - 1.D: missing-file.hbs NOT FOUND!');

      let builder = testBuilder({
        source: helperUtils.fixtures('source-handlebars-builder-test'),
        destination: path.resolve(__dirname, 'output', 'base_handlebars', 'build-no-verbose'),
        builder: helperUtils.fixtures('builder-with-assets'),
        helpers: helperUtils.fixtures('builder-with-assets', 'helpers')
      });
      let styleGuide = new kss.KssStyleGuide({sections: [{header: 'Heading 4.3', reference: '4.3', markup: '4.3.hbs'}]});
      return builder.prepare(styleGuide).then(styleGuide => {
        return builder.build(styleGuide);
      }).then(() => {
        expect(builder.getTestOutput('stdout')).to.include('WARNING: In section 4.3, 4.3.hbs NOT FOUND!');
      });
    });

    it('should trigger buildPage() for each style guide root section', function() {
      let stdout = this.builder.getTestOutput('stdout');
      expect(stdout).to.include(' - section 1 [1]');
      expect(stdout).to.include(' - section 2 [2]');
      expect(stdout).to.include(' - section 3 [Heading 3]');
      expect(stdout).to.include(' - homepage');
    });
  });

  describe('.createMenu', function() {
    it('should create a 2-level hierarchical menu', function() {
      expect(this.files['section-1']).to.include('MENU-ITEM:[referenceURI:1, referenceNumber:1, header:1, isActive:true, children:yes]');
      expect(this.files['section-1']).to.include('MENU-ITEM-CHILD:[referenceURI:1-e, referenceNumber:1.5, header:Heading 1.E, isGrandChild:false]');
      expect(this.files['section-1']).to.include('MENU-ITEM-CHILD:[referenceURI:1-e-a, referenceNumber:1.5.1, header:Heading 1.E.A, isGrandChild:true]');
      expect(this.files['section-1']).to.include('MENU-ITEM:[referenceURI:2, referenceNumber:2, header:2, isActive:false, children:yes]');
      expect(this.files['section-1']).to.include('MENU-ITEM-CHILD:[referenceURI:2-a, referenceNumber:2.1, header:Heading 2.A, isGrandChild:false]');
      expect(this.files['section-1']).to.include('MENU-ITEM:[referenceURI:3, referenceNumber:3, header:Heading 3, isActive:false, children:none]');
    });
  });

  describe('.buildPage', function() {
    it('should build a page', function() {
      expect(this.files['section-1']).to.include('<meta name="generator" content="kss-node" />');
      expect(this.files['section-2']).to.include('<meta name="generator" content="kss-node" />');
      expect(this.files['section-3']).to.include('<meta name="generator" content="kss-node" />');
    });

    it('should add CSS files to the output', function() {
      expect(this.files['index']).to.include('<link rel="stylesheet" href="styles-1.css">');
      expect(this.files['index']).to.include('<link rel="stylesheet" href="styles-2.css">');
    });

    it('should add JS files to the output', function() {
      expect(this.files['index']).to.include('<script src="javascript-1.js"></script>');
      expect(this.files['index']).to.include('<script src="javascript-2.js"></script>');
    });

    it('should build the homepage given "styleGuide.homepage" as pageReference', function() {
      expect(this.files['index']).to.include('<meta name="generator" content="kss-node" />');

      let builder = testBuilder({
        source: helperUtils.fixtures('source-handlebars-builder-test'),
        destination: path.resolve(__dirname, 'output', 'base_handlebars', 'buildPage'),
        builder: helperUtils.fixtures('builder-with-assets'),
        homepage: 'alternate-homepage.md'
      });
      let styleGuide = new kss.KssStyleGuide({sections: [{header: 'Heading 4.3', reference: '4.3'}]});
      return builder.prepare(styleGuide).then(styleGuide => {
        // Instead of running builder.build(), we do 2 of its tasks manually:
        // - save the style guide
        // - compile the Handlebars template
        builder.styleGuide = styleGuide;
        return fs.readFileAsync(path.resolve(builder.options.builder, 'index.hbs'), 'utf8');
      }).then(content => {
        builder.template = builder.Handlebars.compile(content);

        // Now generate the homepage to test this method directly.
        return builder.buildPage('styleGuide.homepage', []);
      }).then(() => {
        return fs.readFileAsync(path.join(__dirname, 'output', 'base_handlebars', 'buildPage', 'index.html'), 'utf8');
      }).then(homepageContent => {
        expect(builder.getTestOutput('stdout')).to.not.include('WARNING: no homepage content found in ' + builder.options.homepage + '.');
        expect(homepageContent).to.include('<p>This is the homepage text from the &quot;alternate-homepage.md&quot; file.</p>');
      });
    });

    it('should warn if homepage content is not found', function() {
      let stdout = this.builder.getTestOutput('stdout');
      expect(stdout).to.include('   ...no homepage content found in homepage.md');
    });
  });

  describe('Handlebars helper: {{markup}}', function() {
    it('should render {{{markup}}}', function() {
      expect(this.files['section-1']).to.include('ref:1.B:markup:<span>inline</span>');
      expect(this.files['section-1']).to.include('ref:1.D:markup:missing-file.hbs NOT FOUND!');
    });

    it('should render {{{markup}}} when there is no markup', function() {
      expect(this.files['section-1']).to.include('ref:1.A:no-markup:\n');
    });

    it('should add modifier_class from the JSON data', function() {
      expect(this.files['section-1']).to.include('ref:1.C:markup:<div class="one-cee-from-json ">');
    });

    it('should add modifier_class from the hash parameter of the helper', function() {
      expect(this.files['section-1']).to.include('ref:1.E:modifier:modifier-1:markup:<div class="HARDCODE"></div>');
    });

    it('should add modifier_class from the modifier\'s className property', function() {
      expect(this.files['section-1']).to.include('ref:1.E:modifier:modifier-1:markup:<div class="modifier-1"></div>');
      expect(this.files['section-1']).to.include('ref:1.E:modifier:pseudo-class-hover:markup:<div class="pseudo-class-hover"></div>');
    });

    it('should add modifier_class from the placeholder option if used on section', function() {
      expect(this.files['section-1']).to.include('ref:1.E:markup:<div class="[modifier class]"></div>');
    });
  });

  describe('Handlebars helper provided by option', function() {
    it('should render optional Handlebars helpers', function() {
      expect(this.files.index).to.include('Handlebars helper loaded into template!');
    });
  });
});

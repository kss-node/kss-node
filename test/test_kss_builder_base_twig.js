/* eslint-disable max-nested-callbacks */

'use strict';

const KssBuilderBase = require('../builder/base'),
  KssBuilderBaseTwig = require('../builder/base/twig'),
  mockStream = require('mock-utf8-stream');

class TestKssBuilderBaseTwig extends KssBuilderBaseTwig {
  constructor(options) {
    super();

    options = options || {};

    if (!options.builder) {
      options.builder = path.resolve(__dirname, '..', 'builder', 'twig');
    }

    // For our tests, feed kss() log functions that mock stdout and stderr so we
    // can capture the output easier.
    this.testStreams = {};
    this.testStreams.stdout = new mockStream.MockWritableStream();
    this.testStreams.stderr = new mockStream.MockWritableStream();
    this.testStreams.stdout.startCapture();
    this.testStreams.stderr.startCapture();
    options.logFunction = (function() {
      let message = '';
      for (let i = 0; i < arguments.length; i++) {
        message += arguments[i];
      }
      this.testStreams.stdout.write(message + '\n');
    }).bind(this);
    options.logErrorFunction = (function(error) {
      // Show the full error stack if the verbose option is used twice or more.
      this.testStreams.stderr.write(((error.stack && options.verbose > 1) ? error.stack : error) + '\n');
    }).bind(this);

    this.addOptions(options);
  }

  getTestOutput(pipe) {
    if (typeof pipe === 'undefined') {
      return {
        stdout: this.testStreams.stdout.capturedData,
        stderr: this.testStreams.stderr.capturedData
      };
    } else {
      return this.testStreams[pipe].capturedData;
    }
  }

  // The internal Twig variable is GLOBAL and the global Twig template
  // registry is reset each time any test's build() is run. So we copy the
  // Twig registry for later inspection by our tests.
  build(styleGuide) {
    return super.build(styleGuide).then(styleGuide => {
      this.Twig.extend(Twig => {
        this.registry = Twig.Templates.registry;
      });
      return Promise.resolve(styleGuide);
    });
  }
}

describe('KssBuilderBaseTwig object API', function() {
  before(function() {
    this.files = {};
    let source = helperUtils.fixtures('source-twig-builder-test'),
      destination = path.resolve(__dirname, 'output', 'base_twig', 'build');
    this.builder = new TestKssBuilderBaseTwig({
      source: [
        source,
        helperUtils.fixtures('source-handlebars-builder-test')
      ],
      destination: destination,
      builder: helperUtils.fixtures('builder-twig-with-assets'),
      extend: helperUtils.fixtures('builder-twig-with-assets', 'extend'),
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
          return fs.readFileAsync(path.join(__dirname, 'output', 'base_twig', 'build', fileName + '.html'), 'utf8').then(data => {
            this.files[fileName] = data;
          });
        })
      );
    });
  });

  describe('KssBuilderBaseTwig constructor', function() {
    it('should create an instance of KssBuilderBase', function() {
      const builder = new KssBuilderBaseTwig();
      expect(builder).to.be.instanceOf(KssBuilderBaseTwig);
      expect(builder).to.be.instanceOf(KssBuilderBase);
    });

    it('should set the proper API version', function() {
      let builder = new KssBuilderBaseTwig();
      expect(builder.API).to.equal('3.0');
    });

    it('should implement the default option definitions', function() {
      let builder = new KssBuilderBaseTwig();
      expect(Object.getOwnPropertyNames(builder.optionDefinitions)).to.deep.equal(['source', 'destination', 'json', 'mask', 'clone', 'builder', 'css', 'js', 'custom', 'extend', 'homepage', 'markup', 'placeholder', 'nav-depth', 'verbose', 'extend-drupal8', 'namespace', 'global']);
    });
  });

  /* eslint-disable guard-for-in,no-loop-func */
  ['buildPage'
  ].forEach(function(method) {
    it('implements ' + method + '() method', function() {
      expect((new KssBuilderBaseTwig())).to.respondTo(method);
    });
  });
  /* eslint-enable guard-for-in,no-loop-func */

  describe('.prepare', function() {
    before(function() {
      this.builderPrepared = new TestKssBuilderBaseTwig({
        'destination': path.resolve(__dirname, 'output', 'base_twig', 'prepare'),
        'builder': helperUtils.fixtures('builder-twig-with-assets'),
        'extend': [helperUtils.fixtures('builder-twig-with-assets', 'extend')],
        'extend-drupal8': true,
        'namespace': ['example:/dev/null/twig', 'invalid-without-semi-colon']
      });
      return this.builderPrepared.prepare(new kss.KssStyleGuide({sections: [{header: 'Section 1', reference: 'one'}]}));
    });

    after(function() {
      return fs.removeAsync(path.resolve(__dirname, 'output', 'base_twig', 'prepare'));
    });

    it('stores the global Twig object', function() {
      expect(this.builderPrepared).to.have.property('Twig');
      expect(this.builderPrepared.Twig).to.be.object;
    });

    it('collects the namespaces to be used by Twig', function() {
      expect(this.builderPrepared.namespaces).to.have.property('builderTwig');
      expect(this.builderPrepared.namespaces.builderTwig).to.equal(helperUtils.fixtures('builder-twig-with-assets'));
      expect(this.builderPrepared.namespaces).to.have.property('example');
      expect(this.builderPrepared.namespaces.example).to.equal('/dev/null/twig');
    });

    it('outputs settings if the verbose option is set', function() {
      let builder = new TestKssBuilderBaseTwig({
        extend: ['/dev/null/example1', '/dev/null/example2'],
        namespace: ['fubar:/dev/null/example1'],
        verbose: true,
        // Force early prepare() failure.
        destination: null
      });
      return builder.prepare(new kss.KssStyleGuide({sections: [{header: 'Section 1', reference: 'one'}]})).catch(error => {
        let output = builder.getTestOutput('stdout');
        expect(output).to.contain('Building your KSS style guide!');
        expect(output).to.contain(' * Extend      : /dev/null/example1, /dev/null/example2');
        return error;
      }).then(error => {
        expect(error.message).to.equal('Path must be a string. Received null');
      });
    });

    it('makes a kss-assets directory', function() {
      return fs.readdirAsync(path.resolve(__dirname, 'output', 'base_twig', 'prepare', 'kss-assets')).then(directoryListing => {
        expect(directoryListing).to.deep.equal(['asset1.js', 'asset2.css']);
      });
    });

    it('loads optional Twig extensions', function() {
      expect(this.builderPrepared.Twig).to.have.property('exampleExtension');
      this.builderPrepared.Twig.extend(function(Twig) {
        expect(Twig.filters).to.have.property('example');
      });
    });

    it('loads optional Twig extensions for Drupal 8', function() {
      this.builderPrepared.Twig.extend(function(Twig) {
        expect(Twig.filters).to.have.property('drupal_escape');
      });
    });
  });

  describe('.build', function() {
    it('compiles the Twig templates', function() {
      expect(this.builder.templates.index).to.be.function;
      expect(this.builder.templates.section).to.be.function;
      expect(this.builder.templates.item).to.be.function;
    });

    it('should save the KssStyleGuide', function() {
      let styleGuide = new kss.KssStyleGuide({
        sections: [
          {header: 'Section A'},
          {header: 'Section B'}
        ]
      });
      let builder = new TestKssBuilderBaseTwig();
      builder.addOptions({
        destination: path.resolve(__dirname, 'output', 'base_twig', 'save-styleguide')
      });
      return builder.prepare(styleGuide).then(styleGuide => {
        return builder.build(styleGuide);
      }).then(() => {
        expect(builder.styleGuide).to.deep.equal(styleGuide);
      });
    });

    it('should list the files parsed if the verbose option is set', function() {
      let stdout = this.builder.getTestOutput('stdout');
      expect(stdout).to.include(' - ' + helperUtils.fixtures('source-twig-builder-test/kss-source.scss'));
      expect(stdout).to.include(' - ' + helperUtils.fixtures('source-twig-builder-test/kss-source-3.scss'));
    });

    it('should list the templates found if the verbose option is set', function() {
      let stdout = this.builder.getTestOutput('stdout');
      expect(stdout).to.include(' - 1.B: inline markup');
      expect(stdout).to.include(' - 1.E: inline markup');
      expect(stdout).to.include(' - 1.C: 1c.twig');
    });

    it('should cache the templates in the Twig registry', function() {
      [
        '1.B',
        '1.E',
        'missing-file.twig',
        '@builderTwig/index.twig',
        '1c.twig',
        '1ea.twig'
      ].forEach(name => {
        expect(this.builder.registry).to.have.property(name);
      });
    });

    it('should register the templates in sectionTemplates', function() {
      [
        '1.B',
        '1.E',
        '1.D',
        '1.C',
        '1.E.A'
      ].forEach(name => {
        expect(this.builder.sectionTemplates).to.have.property(name);
      });
    });

    it('should note missing templates', function() {
      let stdout = this.builder.getTestOutput('stdout');
      expect(stdout).to.include(' - 1.D: missing-file.twig NOT FOUND!');

      let builder = new TestKssBuilderBaseTwig({
        source: helperUtils.fixtures('source-twig-builder-test'),
        destination: path.resolve(__dirname, 'output', 'base_twig', 'build-no-verbose'),
        builder: helperUtils.fixtures('builder-twig-with-assets'),
        extend: helperUtils.fixtures('builder-twig-with-assets', 'extend')
      });
      let styleGuide = new kss.KssStyleGuide({sections: [{header: 'Heading 4.3', reference: '4.3', markup: '4.3.twig'}]});
      return builder.prepare(styleGuide).then(styleGuide => {
        return builder.build(styleGuide);
      }).then(() => {
        expect(builder.getTestOutput('stdout')).to.include('WARNING: In section 4.3, 4.3.twig NOT FOUND!');
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

  describe('.buildPage', function() {
    it('should build a page', function() {
      expect(this.files['section-1']).to.include('<meta name="generator" content="kss-node" />');
      expect(this.files['section-2']).to.include('<meta name="generator" content="kss-node" />');
      expect(this.files['section-3']).to.include('<meta name="generator" content="kss-node" />');
    });

    it('should build the homepage given "index" as templateName', function() {
      expect(this.files['index']).to.include('<meta name="generator" content="kss-node" />');

      let builder = new TestKssBuilderBaseTwig({
        source: helperUtils.fixtures('source-twig-builder-test'),
        destination: path.resolve(__dirname, 'output', 'base_twig', 'buildPage'),
        builder: helperUtils.fixtures('builder-twig-with-assets'),
        homepage: 'alternate-homepage.md'
      });
      let styleGuide = new kss.KssStyleGuide({sections: [{header: 'Heading 4.3', reference: '4.3'}]});
      return builder.prepare(styleGuide).then(styleGuide => {
        // Instead of running builder.build(), we do 3 of its tasks manually:
        // - save the style guide
        // - reset the Twig template registry
        // - compile the Twig template
        builder.styleGuide = styleGuide;
        builder.Twig.extend(function(Twig) {
          Twig.Templates.registry = {};
        });
        return builder.Twig.twigAsync({path: path.resolve(builder.options.builder, 'index.twig')});
      }).then(template => {
        builder.templates = {};
        builder.templates.index = template;
        let options = {};

        // Returns a promise to get a template by name.
        options.getTemplate = name => {
          return this.Twig.twigAsync({
            ref: name
          });
        };
        // Renders a template and returns the markup.
        options.templateRender = (template, context) => {
          return template.render(context);
        };

        // Now generate the homepage to test this method directly.
        return builder.buildPage('index', options, null, []);
      }).then(() => {
        return fs.readFileAsync(path.join(__dirname, 'output', 'base_twig', 'buildPage', 'index.html'), 'utf8');
      }).then(homepageContent => {
        expect(builder.getTestOutput('stdout')).to.not.include('WARNING: no homepage content found in ' + builder.options.homepage + '.');
        expect(homepageContent).to.include('<p>This is the homepage text from the &quot;alternate-homepage.md&quot; file.</p>');
      });
    });
  });

  describe('Twig markup data', function() {
    it('should render {{ markup }}', function() {
      expect(this.files['section-1']).to.include('ref:1.B:example:<span>inline</span>');
      expect(this.files['section-1']).to.include('ref:1.D:example:missing-file.twig NOT FOUND!');
    });

    it('should render kss-example-* {{ markup }}', function() {
      expect(this.files['section-1']).to.include('<h1>Example 1c</h1>');
    });

    it('should render {{ markup }} when there is no markup', function() {
      expect(this.files['section-1']).to.include('ref:1.A:no-example:\n');
    });

    it('should add safe markup from the example JSON data', function() {
      expect(this.files['section-1']).to.include('An item in sampleArray');
      expect(this.files['section-1']).to.include('Empty sampleNull::');
      expect(this.files['section-1']).to.include('sampleProperty value');
    });
  });

  describe('Twig helper provided by option', function() {
    it('should render optional Twig filter', function() {
      expect(this.files.index).to.include('Example Twig filter loaded.');
    });
  });
});

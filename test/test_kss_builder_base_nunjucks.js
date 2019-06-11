/* eslint-disable max-nested-callbacks */

'use strict';

const KssBuilderBase = require('../builder/base'),
  KssBuilderBaseNunjucks = require('../builder/base/nunjucks'),
  mockStream = require('mock-utf8-stream');

class TestKssBuilderBaseNunjucks extends KssBuilderBaseNunjucks {
  constructor(options) {
    super();

    options = options || {};

    if (!options.builder) {
      options.builder = path.resolve(__dirname, '..', 'builder', 'nunjucks');
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
}

describe('KssBuilderBaseNunjucks object API', function() {
  before(function() {
    this.files = {};
    let source = helperUtils.fixtures('source-nunjucks-builder-test'),
      destination = path.resolve(__dirname, 'output', 'base_nunjucks', 'build');
    this.builder = new TestKssBuilderBaseNunjucks({
      source: [
        source,
        helperUtils.fixtures('source-nunjucks-builder-test')
      ],
      destination: destination,
      builder: helperUtils.fixtures('builder-nunjucks-with-assets'),
      extend: helperUtils.fixtures('builder-nunjucks-with-assets', 'extend'),
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
          return fs.readFileAsync(path.join(__dirname, 'output', 'base_nunjucks', 'build', fileName + '.html'), 'utf8').then(data => {
            this.files[fileName] = data;
          });
        })
      );
    });
  });

  describe('KssBuilderBaseNunjucks constructor', function() {
    it('should create an instance of KssBuilderBase', function() {
      const builder = new KssBuilderBaseNunjucks();
      expect(builder).to.be.instanceOf(KssBuilderBaseNunjucks);
      expect(builder).to.be.instanceOf(KssBuilderBase);
    });

    it('should set the proper API version', function() {
      let builder = new KssBuilderBaseNunjucks();
      expect(builder.API).to.equal('3.0');
    });

    it('should implement the default option definitions', function() {
      let builder = new KssBuilderBaseNunjucks();
      expect(Object.getOwnPropertyNames(builder.optionDefinitions)).to.deep.equal(['source', 'base', 'destination', 'json', 'mask', 'clone', 'builder', 'css', 'js', 'custom', 'extend', 'homepage', 'markup', 'placeholder', 'nav-depth', 'verbose', 'extension']);
    });
  });

  /* eslint-disable guard-for-in,no-loop-func */
  ['buildPage'].forEach(function(method) {
    it('implements ' + method + '() method', function() {
      expect((new KssBuilderBaseNunjucks())).to.respondTo(method);
    });
  });
  /* eslint-enable guard-for-in,no-loop-func */

  describe('.prepare', function() {
    before(function() {
      this.builderPrepared = new TestKssBuilderBaseNunjucks({
        destination: path.resolve(__dirname, 'output', 'base_nunjucks', 'prepare'),
        builder: helperUtils.fixtures('builder-nunjucks-with-assets'),
        extend: [helperUtils.fixtures('builder-nunjucks-with-assets', 'extend')]
      });
      return this.builderPrepared.prepare(new kss.KssStyleGuide({sections: [{header: 'Section 1', reference: 'one'}]}));
    });

    after(function() {
      return fs.removeAsync(path.resolve(__dirname, 'output', 'base_nunjucks', 'prepare'));
    });

    it('stores the global Nunjucks object', function() {
      expect(this.builderPrepared).to.have.property('Nunjucks');
      expect(this.builderPrepared.Nunjucks).to.be.an('object');
    });

    it('outputs settings if the verbose option is set', function() {
      let builder = new TestKssBuilderBaseNunjucks({
        extend: ['/dev/null/example1', '/dev/null/example2'],
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
        expect(error.message).to.include('string');
      });
    });

    it('makes a kss-assets directory', function() {
      return fs.readdirAsync(path.resolve(__dirname, 'output', 'base_nunjucks', 'prepare', 'kss-assets')).then(directoryListing => {
        expect(directoryListing).to.deep.equal(['asset1.js', 'asset2.css']);
      });
    });

    it('loads optional Nunjucks extensions', function() {
      expect(this.builderPrepared.NunjucksEnv.getGlobal('test')).to.exist;
      expect(this.builderPrepared.NunjucksEnv.getFilter('test')).to.exist;
    });
  });

  describe('.build', function() {
    it('compiles the Nunjucks templates', function() {
      expect(this.builder.templates.index).to.be.a('object');
      expect(this.builder.templates.section).to.be.a('object');
      expect(this.builder.templates.item).to.be.a('object');
    });

    it('should save the KssStyleGuide', function() {
      let styleGuide = new kss.KssStyleGuide({
        sections: [
          {header: 'Section A'},
          {header: 'Section B'}
        ]
      });
      let builder = new TestKssBuilderBaseNunjucks();
      return builder.build(styleGuide).catch(error => {
        return error;
      }).then(() => {
        expect(builder.styleGuide).to.deep.equal(styleGuide);
      });
    });

    it('should list the files parsed if the verbose option is set', function() {
      let stdout = this.builder.getTestOutput('stdout');
      expect(stdout).to.include(' - ' + helperUtils.fixtures('source-nunjucks-builder-test/kss-source.scss'));
      expect(stdout).to.include(' - ' + helperUtils.fixtures('source-nunjucks-builder-test/kss-source-3.scss'));
    });

    it('should list the partials found if the verbose option is set', function() {
      let stdout = this.builder.getTestOutput('stdout');
      expect(stdout).to.include(' - 1.B: inline markup');
      expect(stdout).to.include(' - 1.E: inline markup');
      expect(stdout).to.include(' - 1.C: 1c.njk');
    });

    it('should register the partials', function() {
      expect(this.builder.templates).to.have.property('1.B');
      expect(this.builder.templates).to.have.property('1.E');
      expect(this.builder.templates).to.have.property('missing-file');
      expect(this.builder.templates).to.have.property('1c');
      expect(Object.keys(this.builder.sectionTemplates).sort()).to.deep.equal(['1.B', '1.C', '1.C.A', '1.C.B', '1.C.C', '1.D', '1.E']);
    });

    it('should note missing partials', function() {
      let stdout = this.builder.getTestOutput('stdout');
      expect(stdout).to.include(' - 1.D: missing-file.njk NOT FOUND!');

      let builder = new TestKssBuilderBaseNunjucks({
        source: helperUtils.fixtures('source-nunjucks-builder-test'),
        destination: path.resolve(__dirname, 'output', 'base_nunjucks', 'build-no-verbose'),
        builder: helperUtils.fixtures('builder-nunjucks-with-assets'),
        extend: helperUtils.fixtures('builder-nunjucks-with-assets', 'extend')
      });
      let styleGuide = new kss.KssStyleGuide({sections: [{header: 'Heading 4.3', reference: '4.3', markup: '4.3.njk'}]});
      return builder.prepare(styleGuide).then(styleGuide => {
        return builder.build(styleGuide);
      }).then(() => {
        expect(builder.getTestOutput('stdout')).to.include('WARNING: In section 4.3, 4.3.njk NOT FOUND!');
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

      let builder = new TestKssBuilderBaseNunjucks({
        source: helperUtils.fixtures('source-nunjucks-builder-test'),
        destination: path.resolve(__dirname, 'output', 'base_nunjucks', 'buildPage'),
        builder: helperUtils.fixtures('builder-nunjucks-with-assets'),
        extend: helperUtils.fixtures('builder-nunjucks-with-assets', 'extend'),
        homepage: helperUtils.fixtures('source-nunjucks-builder-test', 'alternate-homepage.md')
      });
      let styleGuide = new kss.KssStyleGuide({sections: [{header: 'Heading 4.3', reference: '4.3'}]});
      return builder.prepare(styleGuide).then(styleGuide => {
        // Instead of running builder.build(), we do 2 of its tasks manually:
        // - save the style guide
        // - compile the Nunjucks template
        builder.styleGuide = styleGuide;
        return fs.readFileAsync(path.resolve(builder.options.builder, 'index.njk'), 'utf8');
      }).then(content => {
        builder.templates = {};
        builder.templates.index = builder.Nunjucks.compile(content, builder.NunjucksEnv);

        let options = {};

        // Returns a promise to get a template by name.
        options.getTemplate = name => {
          return Promise.resolve(builder.templates[name]);
        };
        // Renders a template and returns the markup.
        options.templateRender = (template, context) => {
          return builder.Nunjucks.render(template, context);
        };

        // Now generate the homepage to test this method directly.
        return builder.buildPage('index', options, null, []);
      }).then(() => {
        return fs.readFileAsync(path.join(__dirname, 'output', 'base_nunjucks', 'buildPage', 'index.html'), 'utf8');
      }).then(homepageContent => {
        expect(builder.getTestOutput('stdout')).to.not.include('WARNING: no homepage content found in ' + builder.options.homepage + '.');
        expect(homepageContent).to.include('<p>This is the homepage text from the &quot;alternate-homepage.md&quot; file.</p>');
      });
    });
  });

  describe('Nunjucks helper: {{markup}}', function() {
    it('should render {{markup}}', function() {
      expect(this.files['section-1']).to.include('ref:1.B:markup:<span>inline</span>');
      expect(this.files['section-1']).to.include('ref:1.D:markup:missing-file.njk NOT FOUND!');
    });

    it('should render {{markup}} when there is no markup', function() {
      expect(this.files['section-1']).to.include('ref:1.A:no-markup:\n');
    });
  });

  describe('Nunjucks helper provided by option', function() {
    it('should render optional Nunjucks global', function() {
      expect(this.files.index).to.include('Nunjucks global loaded into template!');
    });

    it('should render optional Nunjucks filter', function() {
      expect(this.files.index).to.include('Nunjucks filter loaded into template!');
    });
  });
});

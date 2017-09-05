

const KssBuilderBase = require('../kss_builder_base.js'),
      path = require('path'),
      Promise = require('bluebird'),
      Liquid = require('liquid-node');

const fs = Promise.promisifyAll(require('fs-extra'));

class KssBuilderBaseLiquid extends KssBuilderBase {

  constructor() {
    super();

    this.API = '3.0';
  }

  prepare(styleGuide) {
    return super.prepare(styleGuide).then(styleGuide => {

      if(this.options.verbose) {
      this.log('');
    }

    this.engine = new Liquid.Engine;

    console.log();


    let prepTasks = [];

    prepTasks.push(this.prepareDestination('kss-assets'));

    prepTasks.push(this.prepareExtend(this.engine));

    return Promise.all(prepTasks).then(() => {
        return Promise.resolve(styleGuide);
      });
    });
  }


  build(styleGuide) {

    let options = {};

    options.readBuilderTemplate = name => {
      return fs.readFileAsync(path.resolve(this.options.builder, name + '.liquid'), 'utf8').then(content => {
        return this.engine.parse(content);
      });
    }

    options.readSectionTemplate = (name, filepath) => {
      return fs.readFileAsync(filepath, 'utf8').then(contents => {
          return this.engine.registerTag(name, contents);
        });
    };

    options.loadInlineTemplate = (name, markup) => {
      this.engine.registerTag(name, contents);
      return Promise.resolve();
    };

    options.loadContext = filepath => {
      let context;

      try {
        context = require(path.join(path.dirname(filepath), path.basename(filepath, path.extname(filepath)) + '.json'));

        context = JSON.parse(JSON.stringify(context));
      } catch (error) {
        context = {};
      }
      return Promise.resolve(context);
    };

    options.getTemplate = name => {
      return Promise.resolve(this.engine.parse('{{> "' + name + '"}}'));
    };

    options.getTemplateMarkup = name => {
      return Promise.resolve(this.engine.render(name));
    };

    options.templateRender = (template, context) => {
      return template(context);
    };

    options.filenameToTemplateRef = filename => {
      return path.basename(filename, path.extname(filename));
    };

    options.templateExtension = 'liquid';
    options.emptyTemplate = '{{! Cannot be an empty string. }}';

    return this.buildGuide(styleGuide, options);
  }
}

module.exports = KssBuilderBaseLiquid;

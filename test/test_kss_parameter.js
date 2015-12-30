/* eslint-disable max-nested-callbacks */

'use strict';

describe('KssParameter object API', function() {
  before(function() {
    return helperUtils.traverseFixtures({mask: '*.less|*.css'}).then(styleGuide => {
      this.styleGuide = styleGuide;
    });
  });

  /* eslint-disable guard-for-in,no-loop-func */
  ['section',
    'name',
    'description',
    'defaultValue',
    'toJSON'
  ].forEach(function(method) {
    it('has ' + method + '() method', function(done) {
      expect(new kss.KssParameter({})).to.respondTo(method);
      done();
    });
  });
  /* eslint-enable guard-for-in,no-loop-func */

  describe('KssParameter constructor', function() {
    it('should initialize the data', function(done) {
      let obj = new kss.KssParameter();
      expect(obj).to.have.property('meta');
      expect(obj.meta).to.have.property('section');
      expect(obj).to.have.property('data');
      expect(obj.data).to.have.property('name');
      expect(obj.data).to.have.property('description');
      expect(obj.data).to.have.property('defaultValue');
      done();
    });
  });

  describe('.section()', function() {
    it('should return meta.section', function(done) {
      this.styleGuide.data.sections.map(function(section) {
        section.parameters().map(function(parameter) {
          expect(parameter.section()).to.equal(parameter.meta.section).and.equal(section);
        });
      });
      done();
    });

    it('should set meta.section if given a value', function(done) {
      let section = new kss.KssSection({header: 'Section'}),
        parameter = new kss.KssParameter({name: 'original'});
      parameter.section(section);
      expect(parameter.meta.section).to.deep.equal(section);
      expect(parameter.section()).to.deep.equal(parameter.meta.section);
      done();
    });

    it('should return itself if given a value', function(done) {
      let section = new kss.KssSection({header: 'Section'}),
        parameter = new kss.KssParameter({name: 'original'});
      expect(parameter.section(section)).to.deep.equal(parameter);
      done();
    });
  });

  describe('.name()', function() {
    it('should return data.name', function(done) {
      this.styleGuide.data.sections.map(function(section) {
        section.parameters().map(function(parameter) {
          expect(parameter.name()).to.equal(parameter.data.name);
        });
      });
      done();
    });

    it('should set data.name if given a value', function(done) {
      let parameter = new kss.KssParameter({name: 'original'});
      parameter.name('new');
      expect(parameter.data.name).to.equal('new');
      expect(parameter.name()).to.equal(parameter.data.name);
      done();
    });

    it('should return itself if given a value', function(done) {
      let parameter = new kss.KssParameter({name: 'original'});
      expect(parameter.name('new')).to.deep.equal(parameter);
      done();
    });
  });

  describe('.description()', function() {
    it('should return data.description', function(done) {
      this.styleGuide.data.sections.map(function(section) {
        section.parameters().map(function(parameter) {
          expect(parameter.description()).to.equal(parameter.data.description);
        });
      });
      done();
    });

    it('should set data.description if given a value', function(done) {
      let parameter = new kss.KssParameter({description: 'original'});
      parameter.description('new');
      expect(parameter.data.description).to.equal('new');
      expect(parameter.description()).to.equal(parameter.data.description);
      done();
    });

    it('should return itself if given a value', function(done) {
      let parameter = new kss.KssParameter({description: 'original'});
      expect(parameter.description('new')).to.deep.equal(parameter);
      done();
    });
  });

  describe('.defaultValue()', function() {
    it('should return data.defaultValue', function(done) {
      expect(this.styleGuide.sections('parameter.mixinA').parameters(1).defaultValue()).to.equal('Default param2 value');
      this.styleGuide.sections(/^parameter\..*/).map(function(section) {
        section.parameters().map(function(parameter) {
          expect(parameter.defaultValue()).to.equal(parameter.data.defaultValue);
        });
      });
      done();
    });

    it('should set data.defaultValue if given a value', function(done) {
      let parameter = new kss.KssParameter({defaultValue: 'original'});
      parameter.defaultValue('new');
      expect(parameter.data.defaultValue).to.equal('new');
      expect(parameter.defaultValue()).to.equal(parameter.data.defaultValue);
      done();
    });

    it('should return itself if given a value', function(done) {
      let parameter = new kss.KssParameter({defaultValue: 'original'});
      expect(parameter.defaultValue('new')).to.deep.equal(parameter);
      done();
    });
  });

  describe('.toJSON()', function() {
    it('should return valid JSON object', function(done) {
      this.styleGuide.data.sections.map(function(section) {
        section.parameters().map(function(parameter) {
          expect(parameter.toJSON()).to.be.an.instanceOf(Object);
          // Verify it converts to a JSON string.
          let str = JSON.stringify(parameter.toJSON());
          expect(str).to.be.string;
          // Compare JSON string to original.
          expect(JSON.parse(str)).to.deep.equal(parameter.toJSON());
        });
      });
      done();
    });

    it('should return data as a JSON object', function(done) {
      this.styleGuide.data.sections.map(function(section) {
        section.parameters().map(function(parameter) {
          let json = parameter.toJSON();
          expect(json.name).to.equal(parameter.data.name);
          expect(json.defaultValue).to.equal(parameter.data.defaultValue);
          expect(json.description).to.equal(parameter.data.description);
        });
      });
      done();
    });
  });
});

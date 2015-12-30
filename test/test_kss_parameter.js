/* eslint-disable max-nested-callbacks */

'use strict';

describe('KssParameter object API', function() {
  before(function(done) {
    var self = this;
    helperUtils.traverseFixtures({mask: '*.less|*.css'}, function(styleguide) {
      self.styleguide = styleguide;
      done();
    });
  });

  /* eslint-disable guard-for-in,no-loop-func */
  ['section',
    'name',
    'description'
  ].forEach(function(method) {
    it('has ' + method + '() method', function(done) {
      expect(new kss.KssParameter({})).to.respondTo(method);
      done();
    });
  });
  /* eslint-enable guard-for-in,no-loop-func */

  describe('KssParameter constructor', function() {
    it('should initialize the data', function(done) {
      var obj = new kss.KssParameter();
      expect(obj).to.have.property('data');
      expect(obj.data).to.have.property('section');
      expect(obj.data).to.have.property('name');
      expect(obj.data).to.have.property('description');
      done();
    });

    it('should return a KssParameter object when called normally', function(done) {
      /* eslint-disable new-cap */
      var obj = kss.KssParameter({name: '$variable'});
      expect(obj).to.be.an.instanceof(kss.KssParameter);
      expect(obj.name()).to.equal('$variable');
      done();
      /* eslint-enable new-cap */
    });
  });

  describe('.section()', function() {
    it('should return this.section', function(done) {
      this.styleguide.data.sections.map(function(section) {
        section.parameters().map(function(parameter) {
          expect(parameter.section()).to.equal(parameter.data.section).and.equal(section);
        });
      });
      done();
    });

    it('should set data.section if given a value', function(done) {
      var section = new kss.KssSection({header: 'Section'}),
        parameter = new kss.KssParameter({name: 'original'});
      parameter.section(section);
      expect(parameter.data.section).to.deep.equal(section);
      expect(parameter.section()).to.deep.equal(parameter.data.section);
      done();
    });

    it('should return itself if given a value', function(done) {
      var section = new kss.KssSection({header: 'Section'}),
        parameter = new kss.KssParameter({name: 'original'});
      expect(parameter.section(section)).to.deep.equal(parameter);
      done();
    });
  });

  describe('.name()', function() {
    it('should return data.name', function(done) {
      this.styleguide.data.sections.map(function(section) {
        section.parameters().map(function(parameter) {
          expect(parameter.name()).to.equal(parameter.data.name);
        });
      });
      done();
    });

    it('should set data.name if given a value', function(done) {
      var parameter = new kss.KssParameter({name: 'original'});
      parameter.name('new');
      expect(parameter.data.name).to.equal('new');
      expect(parameter.name()).to.equal(parameter.data.name);
      done();
    });

    it('should return itself if given a value', function(done) {
      var parameter = new kss.KssParameter({name: 'original'});
      expect(parameter.name('new')).to.deep.equal(parameter);
      done();
    });
  });

  describe('.description()', function() {
    it('should return data.description', function(done) {
      this.styleguide.data.sections.map(function(section) {
        section.parameters().map(function(parameter) {
          expect(parameter.description()).to.equal(parameter.data.description);
        });
      });
      done();
    });

    it('should set data.description if given a value', function(done) {
      var parameter = new kss.KssParameter({description: 'original'});
      parameter.description('new');
      expect(parameter.data.description).to.equal('new');
      expect(parameter.description()).to.equal(parameter.data.description);
      done();
    });

    it('should return itself if given a value', function(done) {
      var parameter = new kss.KssParameter({description: 'original'});
      expect(parameter.description('new')).to.deep.equal(parameter);
      done();
    });
  });
});

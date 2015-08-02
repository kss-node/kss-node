/*global describe,context,it,before*/
/*eslint-disable max-nested-callbacks*/

'use strict';

var kss = require('../index.js'),
  testUtils = require('./testUtils');

describe('kss.traverse()', function() {
  describe('API validation checks', function() {
    it('should function without options', function(done) {
      kss.traverse(testUtils.fixtures(), function(err, styleguide) {
        err.should.not.be.Error();
        styleguide.data.files.length.should.equal(23);
        done();
      });
    });

    it('should function with options', function(done) {
      kss.traverse(testUtils.fixtures(), {}, function(err, styleguide) {
        err.should.not.be.Error();
        styleguide.data.files.length.should.equal(23);
        done();
      });
    });

    it('should function with an array of directories given', function(done) {
      kss.traverse([testUtils.fixtures('with-include'), testUtils.fixtures('missing-homepage')], {}, function(err, styleguide) {
        err.should.not.be.Error();
        styleguide.data.files.length.should.equal(2);
        done();
      });
    });

    it('should throw an error without a callback', function(done) {
      (function() {kss.traverse(testUtils.fixtures()); }).should.throw();
      done();
    });
  });


  context('given options', function() {
    describe('.mask:', function() {
      describe('default mask', function() {
        before(function(done) {
          var self = this;
          testUtils.traverseFixtures({}, function(styleguide) {
            self.styleguide = styleguide;
            done();
          });
        });

        it('should find file file-type.css', function(done) {
          this.styleguide.should.containFile('file-type.css');
          done();
        });
        it('should find file file-type.less', function(done) {
          this.styleguide.should.containFile('file-type.less');
          done();
        });
        it('should find file file-type.stylus', function(done) {
          this.styleguide.should.containFile('file-type.stylus');
          done();
        });
        it('should find file file-type.styl', function(done) {
          this.styleguide.should.containFile('file-type.styl');
          done();
        });
        it('should find file file-type.sass', function(done) {
          this.styleguide.should.containFile('file-type.sass');
          done();
        });
        it('should find file file-type.scss', function(done) {
          this.styleguide.should.containFile('file-type.scss');
          done();
        });
        it('should find file includes/buttons.less', function(done) {
          this.styleguide.should.containFile('includes/buttons.less');
          done();
        });
        it('should find not file includes/buttons.js', function(done) {
          this.styleguide.should.not.containFile('includes/buttons.js');
          done();
        });
      });

      describe('/\\.js/ (regex)', function() {
        before(function(done) {
          var self = this;
          testUtils.traverseFixtures({mask: /\.js/}, function(styleguide) {
            self.styleguide = styleguide;
            done();
          });
        });

        it('should find file includes/buttons.js', function(done) {
          this.styleguide.should.containFile('includes/buttons.js');
          done();
        });
        it('should find file includes/buttons.less', function(done) {
          this.styleguide.should.not.containFile('includes/buttons.less');
          done();
        });
        it('should find file style.css', function(done) {
          this.styleguide.should.not.containFile('file-type.css');
          done();
        });
      });

      describe("'*.js' (string)", function() {
        before(function(done) {
          var self = this;
          testUtils.traverseFixtures({mask: '*.js'}, function(styleguide) {
            self.styleguide = styleguide;
            done();
          });
        });

        it('should find file includes/buttons.js', function(done) {
          this.styleguide.should.containFile('includes/buttons.js');
          done();
        });
        it('should find file includes/buttons.less', function(done) {
          this.styleguide.should.not.containFile('includes/buttons.less');
          done();
        });
        it('should find file style.css', function(done) {
          this.styleguide.should.not.containFile('file-type.css');
          done();
        });
      });

      describe('/\.js|\.less|\.css/ (regex)', function() {
        before(function(done) {
          var self = this;
          testUtils.traverseFixtures({mask: /\.js|\.less|\.css/}, function(styleguide) {
            self.styleguide = styleguide;
            done();
          });
        });

        it('should find file includes/buttons.js', function(done) {
          this.styleguide.should.containFile('includes/buttons.js');
          done();
        });
        it('should find file includes/buttons.less', function(done) {
          this.styleguide.should.containFile('includes/buttons.less');
          done();
        });
        it('should find file style.css', function(done) {
          this.styleguide.should.containFile('file-type.css');
          done();
        });
      });

      describe("'*.js|*.less|*.css' (string)", function() {
        before(function(done) {
          var self = this;
          testUtils.traverseFixtures({mask: '*.js|*.less|*.css'}, function(styleguide) {
            self.styleguide = styleguide;
            done();
          });
        });

        it('should find file includes/buttons.js', function(done) {
          this.styleguide.should.containFile('includes/buttons.js');
          done();
        });
        it('should find file includes/buttons.less', function(done) {
          this.styleguide.should.containFile('includes/buttons.less');
          done();
        });
        it('should find file style.css', function(done) {
          this.styleguide.should.containFile('file-type.css');
          done();
        });
      });
    });
  });
});

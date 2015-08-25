/* eslint-disable max-nested-callbacks */

'use strict';

describe('kss.traverse()', function() {
  describe('API validation checks', function() {
    it('should function without options', function(done) {
      kss.traverse(helperUtils.fixtures(), function(err, styleguide) {
        should.not.exist(err);
        styleguide.data.files.should.have.length(23);
        done();
      });
    });

    it('should function with options', function(done) {
      kss.traverse(helperUtils.fixtures(), {}, function(err, styleguide) {
        should.not.exist(err);
        styleguide.data.files.should.have.length(23);
        done();
      });
    });

    it('should function with an array of directories given', function(done) {
      kss.traverse([helperUtils.fixtures('with-include'), helperUtils.fixtures('missing-homepage')], {}, function(err, styleguide) {
        should.not.exist(err);
        styleguide.data.files.should.have.length(2);
        done();
      });
    });

    it('should throw an error without a callback', function(done) {
      (function() {kss.traverse(helperUtils.fixtures()); }).should.throw();
      done();
    });
  });


  context('given options', function() {
    describe('.mask:', function() {
      describe('default mask', function() {
        before(function(done) {
          var self = this;
          helperUtils.traverseFixtures({}, function(styleguide) {
            self.styleguide = styleguide;
            done();
          });
        });

        it('should find file file-type.css', function(done) {
          this.styleguide.should.containFixture('file-type.css');
          done();
        });
        it('should find file file-type.less', function(done) {
          this.styleguide.should.containFixture('file-type.less');
          done();
        });
        it('should find file file-type.stylus', function(done) {
          this.styleguide.should.containFixture('file-type.stylus');
          done();
        });
        it('should find file file-type.styl', function(done) {
          this.styleguide.should.containFixture('file-type.styl');
          done();
        });
        it('should find file file-type.sass', function(done) {
          this.styleguide.should.containFixture('file-type.sass');
          done();
        });
        it('should find file file-type.scss', function(done) {
          this.styleguide.should.containFixture('file-type.scss');
          done();
        });
        it('should find file includes/buttons.less', function(done) {
          this.styleguide.should.containFixture('includes/buttons.less');
          done();
        });
        it('should not find file includes/buttons.js', function(done) {
          this.styleguide.should.not.containFixture('includes/buttons.js');
          done();
        });
      });

      describe('/\\.js/ (regex)', function() {
        before(function(done) {
          var self = this;
          helperUtils.traverseFixtures({mask: /\.js/}, function(styleguide) {
            self.styleguide = styleguide;
            done();
          });
        });

        it('should find file includes/buttons.js', function(done) {
          this.styleguide.should.containFixture('includes/buttons.js');
          done();
        });
        it('should find file includes/buttons.less', function(done) {
          this.styleguide.should.not.containFixture('includes/buttons.less');
          done();
        });
        it('should find file style.css', function(done) {
          this.styleguide.should.not.containFixture('file-type.css');
          done();
        });
      });

      describe("'*.js' (string)", function() {
        before(function(done) {
          var self = this;
          helperUtils.traverseFixtures({mask: '*.js'}, function(styleguide) {
            self.styleguide = styleguide;
            done();
          });
        });

        it('should find file includes/buttons.js', function(done) {
          this.styleguide.should.containFixture('includes/buttons.js');
          done();
        });
        it('should find file includes/buttons.less', function(done) {
          this.styleguide.should.not.containFixture('includes/buttons.less');
          done();
        });
        it('should find file style.css', function(done) {
          this.styleguide.should.not.containFixture('file-type.css');
          done();
        });
      });

      describe('/\.js|\.less|\.css/ (regex)', function() {
        before(function(done) {
          var self = this;
          helperUtils.traverseFixtures({mask: /\.js|\.less|\.css/}, function(styleguide) {
            self.styleguide = styleguide;
            done();
          });
        });

        it('should find file includes/buttons.js', function(done) {
          this.styleguide.should.containFixture('includes/buttons.js');
          done();
        });
        it('should find file includes/buttons.less', function(done) {
          this.styleguide.should.containFixture('includes/buttons.less');
          done();
        });
        it('should find file style.css', function(done) {
          this.styleguide.should.containFixture('file-type.css');
          done();
        });
      });

      describe("'*.js|*.less|*.css' (string)", function() {
        before(function(done) {
          var self = this;
          helperUtils.traverseFixtures({mask: '*.js|*.less|*.css'}, function(styleguide) {
            self.styleguide = styleguide;
            done();
          });
        });

        it('should find file includes/buttons.js', function(done) {
          this.styleguide.should.containFixture('includes/buttons.js');
          done();
        });
        it('should find file includes/buttons.less', function(done) {
          this.styleguide.should.containFixture('includes/buttons.less');
          done();
        });
        it('should find file style.css', function(done) {
          this.styleguide.should.containFixture('file-type.css');
          done();
        });
      });
    });
  });
});

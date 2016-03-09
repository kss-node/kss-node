/* eslint-disable max-nested-callbacks */

'use strict';

describe('kss.traverse()', function() {
  describe('API validation checks', function() {
    it('should function without options', function() {
      return kss.traverse(helperUtils.fixtures('traverse-directories')).then(styleGuide => {
        expect(styleGuide).to.be.instanceof(kss.KssStyleGuide);
        expect(styleGuide.data.sections).to.have.length(12);
        expect(styleGuide.meta.files).to.have.length(8);
      }, error => {
        expect(error).to.not.exist;
      });
    });

    it('should function with options', function() {
      return kss.traverse(helperUtils.fixtures('traverse-directories'), {}).then(styleGuide => {
        expect(styleGuide).to.be.instanceof(kss.KssStyleGuide);
        expect(styleGuide.data.sections).to.have.length(12);
        expect(styleGuide.meta.files).to.have.length(8);
      }, error => {
        expect(error).to.not.exist;
      });
    });

    it('should function with an array of directories given', function() {
      return kss.traverse([helperUtils.fixtures('with-include'), helperUtils.fixtures('missing-homepage')], {}).then(styleGuide => {
        expect(styleGuide.meta.files).to.have.length(2);
      }, error => {
        expect(error).to.not.exist;
      });
    });
  });

  context('given options', function() {
    describe('.mask:', function() {
      describe('default mask', function() {
        before(function() {
          // Create an empty directory.
          return fs.removeAsync(helperUtils.fixtures('traverse-directories', 'empty')).catch(() => {
            // Ignore errors.
            return Promise.resolve();
          }).then(() => {
            return fs.mkdirsAsync(helperUtils.fixtures('traverse-directories', 'empty'));
          // Traverse test fixtures.
          }).then(() => {
            return helperUtils.traverseFixtures({source: [helperUtils.fixtures('traverse-directories')]});
          }).then(styleGuide => {
            this.styleGuide = styleGuide;
          });
        });
        after(function() {
          // Remove the empty directory.
          return fs.removeAsync(helperUtils.fixtures('traverse-directories', 'empty'));
        });

        it('should ignore .svn directory', function(done) {
          expect(this.styleGuide).to.not.containFixture('traverse-directories/.svn/to-be-ignored.scss');
          done();
        });
        it('should find file file-type.css', function(done) {
          expect(this.styleGuide).to.containFixture('traverse-directories/file-type.css');
          done();
        });
        it('should find file file-type.less', function(done) {
          expect(this.styleGuide).to.containFixture('traverse-directories/file-type.less');
          done();
        });
        it('should find file file-type.stylus', function(done) {
          expect(this.styleGuide).to.containFixture('traverse-directories/file-type.stylus');
          done();
        });
        it('should find file file-type.styl', function(done) {
          expect(this.styleGuide).to.containFixture('traverse-directories/file-type.styl');
          done();
        });
        it('should find file file-type.sass', function(done) {
          expect(this.styleGuide).to.containFixture('traverse-directories/file-type.sass');
          done();
        });
        it('should find file file-type.scss', function(done) {
          expect(this.styleGuide).to.containFixture('traverse-directories/file-type.scss');
          done();
        });
        it('should find file includes/buttons.less', function(done) {
          expect(this.styleGuide).to.containFixture('traverse-directories/includes/buttons.less');
          done();
        });
        it('should not find file includes/buttons.js', function(done) {
          expect(this.styleGuide).to.not.containFixture('traverse-directories/includes/buttons.js');
          done();
        });
      });

      describe('/\\.js/ (regex)', function() {
        before(function() {
          return helperUtils.traverseFixtures({mask: /\.js/, source: [helperUtils.fixtures('traverse-directories')]}).then(styleGuide => {
            this.styleGuide = styleGuide;
          });
        });

        it('should find file includes/buttons.js', function(done) {
          expect(this.styleGuide).to.containFixture('traverse-directories/includes/buttons.js');
          done();
        });
        it('should find file includes/buttons.less', function(done) {
          expect(this.styleGuide).to.not.containFixture('traverse-directories/includes/buttons.less');
          done();
        });
        it('should find file style.css', function(done) {
          expect(this.styleGuide).to.not.containFixture('traverse-directories/file-type.css');
          done();
        });
      });

      describe("'*.js' (string)", function() {
        before(function() {
          return helperUtils.traverseFixtures({mask: '*.js', source: [helperUtils.fixtures('traverse-directories')]}).then(styleGuide => {
            this.styleGuide = styleGuide;
          });
        });

        it('should find file includes/buttons.js', function(done) {
          expect(this.styleGuide).to.containFixture('traverse-directories/includes/buttons.js');
          done();
        });
        it('should find file includes/buttons.less', function(done) {
          expect(this.styleGuide).to.not.containFixture('traverse-directories/includes/buttons.less');
          done();
        });
        it('should find file style.css', function(done) {
          expect(this.styleGuide).to.not.containFixture('traverse-directories/file-type.css');
          done();
        });
      });

      describe('/\.js|\.less|\.css/ (regex)', function() {
        before(function() {
          return helperUtils.traverseFixtures({mask: /\.js|\.less|\.css/, source: [helperUtils.fixtures('traverse-directories')]}).then(styleGuide => {
            this.styleGuide = styleGuide;
          });
        });

        it('should find file includes/buttons.js', function(done) {
          expect(this.styleGuide).to.containFixture('traverse-directories/includes/buttons.js');
          done();
        });
        it('should find file includes/buttons.less', function(done) {
          expect(this.styleGuide).to.containFixture('traverse-directories/includes/buttons.less');
          done();
        });
        it('should find file style.css', function(done) {
          expect(this.styleGuide).to.containFixture('traverse-directories/file-type.css');
          done();
        });
      });

      describe("'*.js|*.less|*.css' (string)", function() {
        before(function() {
          return helperUtils.traverseFixtures({mask: '*.js|*.less|*.css', source: [helperUtils.fixtures('traverse-directories')]}).then(styleGuide => {
            this.styleGuide = styleGuide;
          });
        });

        it('should find file includes/buttons.js', function(done) {
          expect(this.styleGuide).to.containFixture('traverse-directories/includes/buttons.js');
          done();
        });
        it('should find file includes/buttons.less', function(done) {
          expect(this.styleGuide).to.containFixture('traverse-directories/includes/buttons.less');
          done();
        });
        it('should find file style.css', function(done) {
          expect(this.styleGuide).to.containFixture('traverse-directories/file-type.css');
          done();
        });
      });
    });
  });
});

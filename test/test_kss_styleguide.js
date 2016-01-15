/* eslint-disable max-nested-callbacks */

'use strict';

describe('KssStyleGuide object API', function() {
  before(function(done) {
    var self = this;
    helperUtils.traverseFixtures({mask: /(sections\-queries|sections\-order|property\-styleguide\-word\-keys)\.less/}, function(styleguide) {
      self.styleguide = styleguide;
      helperUtils.traverseFixtures({mask: /.*\-word\-phrases\.less/}, function(styleguideWordPhrases) {
        self.styleguideWordPhrases = styleguideWordPhrases;
        done();
      });
    });
  });

  /* eslint-disable guard-for-in,no-loop-func */
  ['init',
    'section',
    'sortSections',
    'getWeight'
  ].forEach(function(method) {
    it('has ' + method + '() method', function(done) {
      expect(new kss.KssStyleGuide({})).to.respondTo(method);
      done();
    });
  });
  /* eslint-enable guard-for-in,no-loop-func */

  describe('KssStyleGuide constructor', function() {
    it('should initialize the data', function(done) {
      var obj = new kss.KssStyleGuide();
      expect(obj).to.have.property('meta');
      expect(obj.meta).to.have.property('files');
      expect(obj.meta).to.have.property('referenceDelimiter');
      expect(obj.meta).to.have.property('referenceMap');
      expect(obj.meta).to.have.property('weightMap');
      expect(obj).to.have.property('data');
      expect(obj.data).to.have.property('sections');
      done();
    });

    it('should return a KssStyleGuide object when called normally', function(done) {
      /* eslint-disable new-cap */
      var obj = kss.KssStyleGuide();
      expect(obj).to.be.an.instanceof(kss.KssStyleGuide);
      done();
      /* eslint-enable new-cap */
    });
  });

  describe('.customPropertyNames()', function() {
    it('should return data.customPropertyNames', function(done) {
      expect(this.styleguide.customPropertyNames()).to.equal(this.styleguide.data.customPropertyNames);
      done();
    });

    it('should update data.customPropertyNames if given a string', function(done) {
      var styleguide = new kss.KssStyleGuide({customPropertyNames: ['original']});
      styleguide.customPropertyNames('new');
      expect(styleguide.data.customPropertyNames).to.deep.equal(['original', 'new']);
      done();
    });

    it('should update data.customPropertyNames if given an array', function(done) {
      var styleguide = new kss.KssStyleGuide({customPropertyNames: ['original']});
      styleguide.customPropertyNames(['new', 'new2']);
      expect(styleguide.data.customPropertyNames).to.deep.equal(['original', 'new', 'new2']);
      done();
    });

    it('should return itself if given a value', function(done) {
      var styleguide = new kss.KssStyleGuide({header: 'original'});
      expect(styleguide.customPropertyNames('new')).to.deep.equal(styleguide);
      done();
    });
  });

  describe('.section()', function() {
    context('given no arguments', function() {
      it('should return only referenced sections', function(done) {
        this.styleguide.section().map(function(section) {
          expect(section.data).to.have.property('reference');
        });
        done();
      });

      it('should return all referenced sections', function(done) {
        var results = [],
          expected = [
            '4', '4.1',
            '4.1.1', '4.1.1.1', '4.1.1.2',
            '4.1.2', '4.1.2.2',
            '8',
            '9', '9.1', '9.1.1', '9.2', '9.3', '9.4', '9.5', '9.10', '9.11', '9.100',
            'alpha', 'alpha.alpha', 'alpha.alpha.alpha', 'alpha.beta', 'alpha.delta', 'alpha.epsilon', 'alpha.gamma', 'alpha-bet',
            'WordKeys.Base.Link', 'WordKeys.Components', 'WordKeys.Components.Message', 'WordKeys.Components.Tabs', 'WordKeys.Forms.Button', 'WordKeys.Forms.Input'
          ];
        this.styleguide.section().map(function(section) {
          results.push(section.reference());
        });
        expect(results).to.deep.equal(expected);
        done();
      });
    });

    context('given exact references', function() {
      it('should find a reference with depth 1', function(done) {
        var section = this.styleguide.section('4');
        expect(section.header()).to.equal('DEPTH OF 1');
        expect(section.depth()).to.equal(1);
        expect(section.reference()).to.equal('4');
        done();
      });

      it('should find a reference with depth 3 and no modifiers', function(done) {
        var section = this.styleguide.section('4.1.1');
        expect(section.header()).to.equal('DEPTH OF 3, NO MODIFIERS');
        expect(section.reference()).to.equal('4.1.1');
        expect(section.depth()).to.equal(3);
        done();
      });

      it('should find a reference with depth 3 and modifiers', function(done) {
        var section = this.styleguide.section('4.1.2');
        expect(section.header()).to.equal('DEPTH OF 3, MODIFIERS');
        expect(section.depth()).to.equal(3);
        expect(section.reference()).to.equal('4.1.2');
        done();
      });

      it('should not find a reference with depth 3 that does not exist', function(done) {
        expect(this.styleguide.section('4.1.3')).to.be.false;
        done();
      });

      it('should find a reference with depth 4 (A)', function(done) {
        var section = this.styleguide.section('4.1.1.1');
        expect(section.header()).to.equal('DEPTH OF 4 (A)');
        expect(section.depth()).to.equal(4);
        expect(section.reference()).to.equal('4.1.1.1');
        done();
      });

      it('should find a reference with depth 4 (B)', function(done) {
        var section = this.styleguide.section('4.1.1.2');
        expect(section.header()).to.equal('DEPTH OF 4 (B)');
        expect(section.depth()).to.equal(4);
        expect(section.reference()).to.equal('4.1.1.2');
        done();
      });

      it('should find a reference with depth 4 (C)', function(done) {
        var section = this.styleguide.section('4.1.2.2');
        expect(section.header()).to.equal('DEPTH OF 4 (C)');
        expect(section.depth()).to.equal(4);
        expect(section.reference()).to.equal('4.1.2.2');
        done();
      });
    });

    context('given string queries', function() {
      it('should return 1 level of descendants when given "4.x"', function(done) {
        var sections = this.styleguide.section('4.x');
        sections.map(function(section) {
          expect(section.reference()).to.equal('4.1');
          expect(section.header()).to.equal('DEPTH OF 2');
        });
        expect(sections.length).to.equal(1);
        done();
      });

      it('should return 1 level of descendants when given "4.1.x"', function(done) {
        var results,
          expected = ['4.1.1', '4.1.2'];
        results = this.styleguide.section('4.1.x').map(function(section) {
          return section.reference();
        });
        expect(results).to.deep.equal(expected);
        done();
      });

      it('should return 2 levels of descendants when given "4.x.x"', function(done) {
        var results,
          expected = ['4.1', '4.1.1', '4.1.2'];
        results = this.styleguide.section('4.x.x').map(function(section) {
          return section.reference();
        });
        expect(results).to.deep.equal(expected);
        done();
      });

      it('should return "4.1" and all levels of descendants when given "4.1.*"', function(done) {
        var results,
          expected = ['4.1', '4.1.1', '4.1.1.1', '4.1.1.2', '4.1.2', '4.1.2.2'];
        results = this.styleguide.section('4.1.*').map(function(section) {
          return section.reference();
        });
        expect(results).to.deep.equal(expected);
        done();
      });

      it('should not find "alpha" section when given a query for "alp.*"', function(done) {
        expect(this.styleguide.section('alp.*')).to.be.an.instanceOf(Array);
        expect(this.styleguide.section('alp.*')).to.have.length(0);
        done();
      });

      it('should not find "alpha" section when given a query for "alp.x"', function(done) {
        expect(this.styleguide.section('alp.x')).to.be.an.instanceOf(Array);
        expect(this.styleguide.section('alp.x')).to.have.length(0);
        done();
      });

      it('should return numeric sections in order', function(done) {
        var results,
          expected = ['9.1', '9.2', '9.3', '9.4', '9.5', '9.10', '9.11', '9.100'];
        results = this.styleguide.section('9.x').map(function(section) {
          return section.reference();
        });
        expect(results).to.deep.equal(expected);
        done();
      });

      it('should return "word key" sections in order', function(done) {
        var results,
          expected = ['alpha.alpha', 'alpha.beta', 'alpha.delta', 'alpha.epsilon', 'alpha.gamma'];
        results = this.styleguide.section('alpha.x').map(function(section) {
          return section.reference();
        });
        expect(results).to.deep.equal(expected);
        done();
      });

      it('should return "word key" sections with dashes in the name', function(done) {
        var sections = this.styleguide.section('alpha-bet.*');
        sections.map(function(section) {
          expect(section.reference()).to.equal('alpha-bet');
        });
        expect(sections.length).to.equal(1);
        done();
      });

      it('should return "word phrase" sections in order', function(done) {
        var results,
          expected = ['beta - alpha', 'beta - beta', 'beta - delta', 'beta - epsilon', 'beta - gamma'];
        results = this.styleguideWordPhrases.section('beta.x').map(function(section) {
          return section.reference();
        });
        expect(results).to.deep.equal(expected);
        done();
      });
    });

    context('given regex queries', function() {
      it('should return an empty array when query does not match', function(done) {
        expect(this.styleguide.section(/__does_not_match__.*/)).to.be.an.instanceOf(Array).and.empty;
        done();
      });

      it('should return "4" and all levels of descendants when given /4.*/', function(done) {
        var results,
          expected = ['4', '4.1', '4.1.1', '4.1.1.1', '4.1.1.2', '4.1.2', '4.1.2.2'];
        results = this.styleguide.section(/4.*/).map(function(section) {
          return section.reference();
        });
        expect(results).to.deep.equal(expected);
        done();
      });

      it('should return "4" when given /4/', function(done) {
        var sections = this.styleguide.section(/4/);
        sections.map(function(section) {
          expect(section.reference()).to.equal('4');
        });
        expect(sections.length).to.equal(1);
        done();
      });

      it('should return numeric sections in order', function(done) {
        var results,
          expected = ['9', '9.1', '9.1.1', '9.2', '9.3', '9.4', '9.5', '9.10', '9.11', '9.100'];
        results = this.styleguide.section(/9.*/).map(function(section) {
          return section.reference();
        });
        expect(results).to.deep.equal(expected);
        done();
      });

      it('should return "word key" sections in order', function(done) {
        var results,
          expected = ['alpha.alpha', 'alpha.alpha.alpha', 'alpha.beta', 'alpha.delta', 'alpha.epsilon', 'alpha.gamma'];
        results = this.styleguide.section(/alpha\..*/).map(function(section) {
          return section.reference();
        });
        expect(results).to.deep.equal(expected);
        done();
      });

      it('should return "word phrase" sections in order', function(done) {
        var results,
          expected = ['beta - alpha', 'beta - alpha - alpha', 'beta - beta', 'beta - delta', 'beta - epsilon', 'beta - gamma'];
        results = this.styleguideWordPhrases.section(/beta - .*/).map(function(section) {
          return section.reference();
        });
        expect(results).to.deep.equal(expected);
        done();
      });

      it('should return weighted "word phrase" sections in order', function(done) {
        var results,
          expected = ['gamma - alpha', 'gamma - alpha - delta', 'gamma - alpha - gamma', 'gamma - alpha - beta', 'gamma - alpha - alpha', 'gamma - beta', 'gamma - gamma', 'gamma - delta', 'gamma - epsilon'];
        results = this.styleguideWordPhrases.section(/gamma - .*/).map(function(section) {
          return section.reference();
        });
        expect(results).to.deep.equal(expected);
        done();
      });

      it('should return autoincrement values for "word phrase" sections in order', function(done) {
        var results,
          expected = ['2.1', '2.1.1', '2.1.2', '2.1.3', '2.1.4', '2.2', '2.3', '2.4', '2.5'];
        results = this.styleguideWordPhrases.section(/gamma - .*/).map(function(section) {
          return section.data.autoincrement;
        });
        expect(results).to.deep.equal(expected);
        done();
      });
    });
  });

  describe('.getWeight()', function() {
    var expected = {
      'beta - delta': [0, 0],
      'beta - alpha': [0, 0],
      'beta - beta': [0, 0],
      'beta - epsilon': [0, 0],
      'beta - gamma': [0, 0],
      'beta': [0],
      'beta - alpha - alpha': [0, 0, 0],
      'gamma': [0],
      'gamma - alpha': [0, 0],
      'gamma - alpha - delta': [0, 0, -10000],
      'gamma - alpha - gamma': [0, 0, -1000],
      'gamma - alpha - beta': [0, 0, -100],
      'gamma - alpha - alpha': [0, 0, -10],
      'gamma - beta': [0, 0],
      'gamma - gamma': [0, 1],
      'gamma - delta': [0, 2],
      'gamma - epsilon': [0, 0, 2],
      'WordPhrases - Forms - Button': [0, 0, 0],
      'WordPhrases - Base - Link': [0, 0, 0],
      'WordPhrases - Components': [0, 0],
      'WordPhrases - Components - Message box': [0, 0, 0],
      'WordPhrases - Components - Tabs': [0, 0, 0],
      'WordPhrases - Forms - Input field': [0, 0, 0]
    };

    it('should return the proper weight for each depth', function(done) {
      var self = this;
      this.styleguideWordPhrases.section().map(function(section) {
        var ref = section.reference();
        for (var i; i < expected[ref].length; i++) {
          expect(self.styleguideWordPhrases.getWeight(ref, i)).to.equal(expected[ref][i]);
        }
      });
      done();
    });

    it('should return the proper weight given no depth', function(done) {
      var self = this;
      this.styleguideWordPhrases.section().map(function(section) {
        var ref = section.reference();
        expect(self.styleguideWordPhrases.getWeight(ref)).to.equal(expected[ref][expected[ref].length - 1]);
      });
      done();
    });
  });
});

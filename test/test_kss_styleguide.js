/* eslint-disable max-nested-callbacks */

'use strict';

describe('KssStyleGuide object API', function() {
  before(function() {
    return Promise.all([
      helperUtils.traverseFixtures({mask: /(sections\-queries|sections\-order|property\-styleguide\-word\-keys)\.less/}).then(styleGuide => {
        this.styleGuide = styleGuide;
      }),
      helperUtils.traverseFixtures({mask: /.*\-word\-phrases\.less/}).then(styleGuide => {
        this.styleGuideWordPhrases = styleGuide;
      }),
      helperUtils.traverseFixtures({mask: /sections\-queries\.less/}).then(styleGuide => {
        this.styleGuideNumeric = styleGuide;
      })
    ]);
  });

  /* eslint-disable guard-for-in,no-loop-func */
  ['toJSON',
    'autoInit',
    'init',
    'customPropertyNames',
    'hasNumericReferences',
    'referenceDelimiter',
    'sections'
  ].forEach(function(method) {
    it('has ' + method + '() method', function(done) {
      expect(new kss.KssStyleGuide({})).to.respondTo(method);
      done();
    });
  });
  /* eslint-enable guard-for-in,no-loop-func */

  describe('KssStyleGuide constructor', function() {
    it('should initialize the data', function(done) {
      let obj = new kss.KssStyleGuide();
      expect(obj).to.have.property('meta');
      expect(obj.meta).to.have.property('autoInit');
      expect(obj.meta).to.have.property('files');
      expect(obj.meta).to.have.property('hasNumericReferences');
      expect(obj.meta).to.have.property('needsDepth');
      expect(obj.meta).to.have.property('needsReferenceNumber');
      expect(obj.meta).to.have.property('needsSort');
      expect(obj.meta).to.have.property('referenceDelimiter');
      expect(obj.meta).to.have.property('referenceMap');
      expect(obj.meta).to.have.property('weightMap');
      expect(obj).to.have.property('data');
      expect(obj.data).to.have.property('customPropertyNames');
      expect(obj.data).to.have.property('sections');
      done();
    });
  });

  describe('.toJSON()', function() {
    it('should return valid JSON object', function(done) {
      expect(this.styleGuide.toJSON()).to.be.an.instanceOf(Object);
      // Verify it converts to a JSON string.
      let str = JSON.stringify(this.styleGuide.toJSON());
      expect(str).to.be.string;
      // Compare JSON string to original.
      expect(JSON.parse(str)).to.deep.equal(this.styleGuide.toJSON());
      done();
    });

    it('should output the same data given to constructor', function(done) {
      let data = {
        customPropertyNames: ['custom1', 'custom2'],
        hasNumericReferences: true,
        referenceDelimiter: '.',
        sections: [
          {
            deprecated: false,
            depth: 2,
            description: 'lorem ipsum',
            experimental: false,
            header: 'example',
            markup: '<div class="example">lorem ipsum</div>',
            modifiers: [],
            parameters: [],
            reference: '1.1',
            referenceNumber: '1.1',
            referenceURI: '1-1',
            weight: 0
          }
        ]
      };
      let styleGuide = new kss.KssStyleGuide(data);
      expect(styleGuide.toJSON()).to.deep.equal(data);
      done();
    });
  });

  describe('.autoInit()', function() {
    it('should update meta.autoInit if given true', function(done) {
      let styleGuide = new kss.KssStyleGuide({autoInit: false});
      styleGuide.autoInit(true);
      expect(styleGuide.meta.autoInit).to.be.true;
      done();
    });

    it('should update meta.autoInit if given false', function(done) {
      let styleGuide = new kss.KssStyleGuide();
      styleGuide.autoInit(false);
      expect(styleGuide.meta.autoInit).to.be.false;
      done();
    });

    it('should return itself', function(done) {
      let styleGuide = new kss.KssStyleGuide({autoInit: false});
      expect(styleGuide.autoInit(true)).to.deep.equal(styleGuide);
      done();
    });
  });

  describe('.init()', function() {
    it('it should re-sort the style guide when new sections are added', function() {
      let styleGuide = new kss.KssStyleGuide({
        sections: [
          {header: 'Section 1.3', reference: '1.3'},
          {header: 'Section 1.1', reference: '1.1'}
        ],
        autoInit: false
      });
      styleGuide.sections({header: 'Section 1.2', reference: '1.2'});
      expect(styleGuide.data.sections.map(section => section.reference())).to.deep.equal(['1.3', '1.1', '1.2']);
      styleGuide.init();
      expect(styleGuide.data.sections.map(section => section.reference())).to.deep.equal(['1.1', '1.2', '1.3']);
    });

    it('it should auto-increment sections in the style guide', function() {
      let styleGuide = new kss.KssStyleGuide({
        sections: [
          {header: 'Section 1.1', reference: 'section.1'},
          {header: 'Section 1.2', reference: 'section.2'},
          {header: 'Section 1.3', reference: 'section.3'}
        ],
        autoInit: false
      });
      styleGuide.sections();
      expect(styleGuide.data.sections.map(section => section.referenceNumber())).to.deep.equal(['', '', '']);
      styleGuide.meta.needsSort = false;
      styleGuide.init();
      expect(styleGuide.data.sections.map(section => section.referenceNumber())).to.deep.equal(['1.1', '1.2', '1.3']);
    });
  });

  describe('.customPropertyNames()', function() {
    it('should return data.customPropertyNames', function(done) {
      expect(this.styleGuide.customPropertyNames()).to.equal(this.styleGuide.data.customPropertyNames);
      done();
    });

    it('should update data.customPropertyNames if given a string', function(done) {
      let styleGuide = new kss.KssStyleGuide({customPropertyNames: ['original']});
      styleGuide.customPropertyNames('new');
      expect(styleGuide.data.customPropertyNames).to.deep.equal(['original', 'new']);
      done();
    });

    it('should update data.customPropertyNames if given an array', function(done) {
      let styleGuide = new kss.KssStyleGuide({customPropertyNames: ['original']});
      styleGuide.customPropertyNames(['new', 'new2']);
      expect(styleGuide.data.customPropertyNames).to.deep.equal(['original', 'new', 'new2']);
      done();
    });

    it('should return itself if given a value', function(done) {
      let styleGuide = new kss.KssStyleGuide({customPropertyNames: ['original']});
      expect(styleGuide.customPropertyNames('new')).to.deep.equal(styleGuide);
      done();
    });
  });

  describe('.hasNumericReferences()', function() {
    it('should return meta.hasNumericReferences', function(done) {
      expect(this.styleGuide.hasNumericReferences()).to.equal(this.styleGuide.meta.hasNumericReferences).and.to.be.false;
      expect(this.styleGuideNumeric.hasNumericReferences()).to.equal(this.styleGuideNumeric.meta.hasNumericReferences).and.to.be.true;
      expect(this.styleGuideWordPhrases.hasNumericReferences()).to.equal(this.styleGuideWordPhrases.meta.hasNumericReferences).and.to.be.false;
      done();
    });
  });

  describe('.referenceDelimiter()', function() {
    it('should return meta.referenceDelimiter', function(done) {
      expect(this.styleGuide.referenceDelimiter()).to.equal(this.styleGuide.meta.referenceDelimiter).and.to.equal('.');
      expect(this.styleGuideNumeric.referenceDelimiter()).to.equal(this.styleGuideNumeric.meta.referenceDelimiter).and.to.equal('.');
      expect(this.styleGuideWordPhrases.referenceDelimiter()).to.equal(this.styleGuideWordPhrases.meta.referenceDelimiter).and.to.equal(' - ');
      done();
    });
  });

  describe('.sections()', function() {
    context('given new sections', function() {
      it('it should add a JSON section to the style guide', function() {
        let styleGuide = new kss.KssStyleGuide({
          sections: [
            {header: 'Section 1.3', reference: '1.3'},
            {header: 'Section 1.1', reference: '1.1'}
          ]
        });
        styleGuide.sections({header: 'Section 1.2', reference: '1.2'});
        expect(styleGuide.data.sections.map(section => section.reference())).to.deep.equal(['1.1', '1.2', '1.3']);
        expect(styleGuide.meta.referenceMap['1.2'].header()).to.equal('Section 1.2');
      });

      it('it should add a KssSection to the style guide', function() {
        let styleGuide = new kss.KssStyleGuide({
          sections: [
            {header: 'Section 1.3', reference: '1.3'},
            {header: 'Section 1.1', reference: '1.1'}
          ]
        });
        let section = new kss.KssSection({header: 'Section 1.2', reference: '1.2'});
        styleGuide.sections(section);
        expect(styleGuide.data.sections.map(section => section.reference())).to.deep.equal(['1.1', '1.2', '1.3']);
        expect(styleGuide.meta.referenceMap['1.2']).to.deep.equal(section);
      });
    });

    context('given no arguments', function() {
      it('should return all referenced sections', function(done) {
        let results = [],
          expected = [
            '4', '4.1',
            '4.1.1', '4.1.1.1', '4.1.1.2',
            '4.1.2', '4.1.2.2',
            '8',
            '9', '9.1', '9.1.1', '9.2', '9.3', '9.4', '9.5', '9.10', '9.11', '9.100',
            'alpha', 'alpha.alpha', 'alpha.alpha.alpha', 'alpha.beta', 'alpha.delta', 'alpha.epsilon', 'alpha.gamma', 'alpha-bet',
            'WordKeys.Base.Link', 'WordKeys.Components', 'WordKeys.Components.Message', 'WordKeys.Components.Tabs', 'WordKeys.Forms.Button', 'WordKeys.Forms.Input'
          ];
        this.styleGuide.sections().map(function(section) {
          results.push(section.reference());
        });
        expect(results).to.deep.equal(expected);
        done();
      });
    });

    context('given exact references', function() {
      it('should find a reference with depth 1', function(done) {
        let section = this.styleGuide.sections('4');
        expect(section.header()).to.equal('DEPTH OF 1');
        expect(section.depth()).to.equal(1);
        expect(section.reference()).to.equal('4');
        done();
      });

      it('should find a reference with depth 3 and no modifiers', function(done) {
        let section = this.styleGuide.sections('4.1.1');
        expect(section.header()).to.equal('DEPTH OF 3, NO MODIFIERS');
        expect(section.reference()).to.equal('4.1.1');
        expect(section.depth()).to.equal(3);
        done();
      });

      it('should find a reference with depth 3 and modifiers', function(done) {
        let section = this.styleGuide.sections('4.1.2');
        expect(section.header()).to.equal('DEPTH OF 3, MODIFIERS');
        expect(section.depth()).to.equal(3);
        expect(section.reference()).to.equal('4.1.2');
        done();
      });

      it('should not find a reference with depth 3 that does not exist', function(done) {
        expect(this.styleGuide.sections('4.1.3')).to.be.false;
        done();
      });

      it('should find a reference with depth 4 (A)', function(done) {
        let section = this.styleGuide.sections('4.1.1.1');
        expect(section.header()).to.equal('DEPTH OF 4 (A)');
        expect(section.depth()).to.equal(4);
        expect(section.reference()).to.equal('4.1.1.1');
        done();
      });

      it('should find a reference with depth 4 (B)', function(done) {
        let section = this.styleGuide.sections('4.1.1.2');
        expect(section.header()).to.equal('DEPTH OF 4 (B)');
        expect(section.depth()).to.equal(4);
        expect(section.reference()).to.equal('4.1.1.2');
        done();
      });

      it('should find a reference with depth 4 (C)', function(done) {
        let section = this.styleGuide.sections('4.1.2.2');
        expect(section.header()).to.equal('DEPTH OF 4 (C)');
        expect(section.depth()).to.equal(4);
        expect(section.reference()).to.equal('4.1.2.2');
        done();
      });
    });

    context('given string queries', function() {
      it('should return 1 level of descendants when given "4.x"', function(done) {
        let sections = this.styleGuide.sections('4.x');
        sections.map(function(section) {
          expect(section.reference()).to.equal('4.1');
          expect(section.header()).to.equal('DEPTH OF 2');
        });
        expect(sections.length).to.equal(1);
        done();
      });

      it('should return 1 level of descendants when given "4.1.x"', function(done) {
        let expected = ['4.1.1', '4.1.2'];
        let results = this.styleGuide.sections('4.1.x').map(function(section) {
          return section.reference();
        });
        expect(results).to.deep.equal(expected);
        done();
      });

      it('should return 2 levels of descendants when given "4.x.x"', function(done) {
        let expected = ['4.1', '4.1.1', '4.1.2'];
        let results = this.styleGuide.sections('4.x.x').map(function(section) {
          return section.reference();
        });
        expect(results).to.deep.equal(expected);
        done();
      });

      it('should return "4.1" and all levels of descendants when given "4.1.*"', function(done) {
        let results,
          expected = ['4.1', '4.1.1', '4.1.1.1', '4.1.1.2', '4.1.2', '4.1.2.2'];
        results = this.styleGuide.sections('4.1.*').map(function(section) {
          return section.reference();
        });
        expect(results).to.deep.equal(expected);
        done();
      });

      it('should not find "alpha" section when given a query for "alp.*"', function(done) {
        expect(this.styleGuide.sections('alp.*')).to.be.an.instanceOf(Array);
        expect(this.styleGuide.sections('alp.*')).to.have.length(0);
        done();
      });

      it('should not find "alpha" section when given a query for "alp.x"', function(done) {
        expect(this.styleGuide.sections('alp.x')).to.be.an.instanceOf(Array);
        expect(this.styleGuide.sections('alp.x')).to.have.length(0);
        done();
      });

      it('should return numeric sections in order', function(done) {
        let expected = ['9.1', '9.2', '9.3', '9.4', '9.5', '9.10', '9.11', '9.100'];
        let results = this.styleGuide.sections('9.x').map(function(section) {
          return section.reference();
        });
        expect(results).to.deep.equal(expected);
        done();
      });

      it('should return "word key" sections in order', function(done) {
        let expected = ['alpha.alpha', 'alpha.beta', 'alpha.delta', 'alpha.epsilon', 'alpha.gamma'];
        let results = this.styleGuide.sections('alpha.x').map(function(section) {
          return section.reference();
        });
        expect(results).to.deep.equal(expected);
        done();
      });

      it('should return "word key" sections with dashes in the name', function(done) {
        let sections = this.styleGuide.sections('alpha-bet.*');
        sections.map(function(section) {
          expect(section.reference()).to.equal('alpha-bet');
        });
        expect(sections.length).to.equal(1);
        done();
      });

      it('should return "word phrase" sections in order', function(done) {
        let expected = ['beta - alpha', 'beta - beta', 'beta - delta', 'beta - epsilon', 'beta - gamma'];
        let results = this.styleGuideWordPhrases.sections('beta.x').map(function(section) {
          return section.reference();
        });
        expect(results).to.deep.equal(expected);
        done();
      });
    });

    context('given regex queries', function() {
      it('should return an empty array when query does not match', function(done) {
        expect(this.styleGuide.sections(/__does_not_match__.*/)).to.be.an.instanceOf(Array).and.empty;
        done();
      });

      it('should return "4" and all levels of descendants when given /4.*/', function(done) {
        let expected = ['4', '4.1', '4.1.1', '4.1.1.1', '4.1.1.2', '4.1.2', '4.1.2.2'];
        let results = this.styleGuide.sections(/4.*/).map(function(section) {
          return section.reference();
        });
        expect(results).to.deep.equal(expected);
        done();
      });

      it('should return "4" when given /4/', function(done) {
        let sections = this.styleGuide.sections(/4/);
        sections.map(function(section) {
          expect(section.reference()).to.equal('4');
        });
        expect(sections.length).to.equal(1);
        done();
      });

      it('should return numeric sections in order', function(done) {
        let expected = ['9', '9.1', '9.1.1', '9.2', '9.3', '9.4', '9.5', '9.10', '9.11', '9.100'];
        let results = this.styleGuide.sections(/9.*/).map(function(section) {
          return section.reference();
        });
        expect(results).to.deep.equal(expected);
        done();
      });

      it('should return "word key" sections in order', function(done) {
        let expected = ['alpha.alpha', 'alpha.alpha.alpha', 'alpha.beta', 'alpha.delta', 'alpha.epsilon', 'alpha.gamma'];
        let results = this.styleGuide.sections(/alpha\..*/).map(function(section) {
          return section.reference();
        });
        expect(results).to.deep.equal(expected);
        done();
      });

      it('should return "word phrase" sections in order', function(done) {
        let expected = ['beta - alpha', 'beta - alpha - alpha', 'beta - beta', 'beta - delta', 'beta - epsilon', 'beta - gamma'];
        let results = this.styleGuideWordPhrases.sections(/beta - .*/).map(function(section) {
          return section.reference();
        });
        expect(results).to.deep.equal(expected);
        done();
      });

      it('should return weighted "word phrase" sections in order', function(done) {
        let expected = ['gamma - alpha', 'gamma - alpha - delta', 'gamma - alpha - gamma', 'gamma - alpha - beta', 'gamma - alpha - alpha', 'gamma - beta', 'gamma - gamma', 'gamma - delta', 'gamma - epsilon'];
        let results = this.styleGuideWordPhrases.sections(/gamma - .*/).map(function(section) {
          return section.reference();
        });
        expect(results).to.deep.equal(expected);
        done();
      });

      it('should return referenceNumber values for "word phrase" sections in order', function(done) {
        let expected = ['2.1', '2.1.1', '2.1.2', '2.1.3', '2.1.4', '2.2', '2.3', '2.4', '2.5'];
        let results = this.styleGuideWordPhrases.sections(/gamma - .*/).map(function(section) {
          return section.referenceNumber();
        });
        expect(results).to.deep.equal(expected);
        done();
      });
    });
  });
});

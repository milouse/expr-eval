/* global describe, it */

'use strict';

var expect = require('chai').expect;
var Parser = require('../dist/bundle').Parser;

describe('Parser', function () {
  [
    { name: 'normal parse()', parser: new Parser() },
    { name: 'disallowing member access', parser: new Parser({ allowMemberAccess: false }) }
  ].forEach(function (tcase) {
    var parser = tcase.parser;
    describe(tcase.name, function () {
      it('should skip comments', function () {
        expect(parser.evaluate('2/* comment */+/* another comment */3')).to.equal(5);
        expect(parser.evaluate('2/* comment *///* another comment */3')).to.equal(2 / 3);
        expect(parser.evaluate('/* comment at the beginning */2 + 3/* unterminated comment')).to.equal(5);
        expect(parser.evaluate('2 +/* comment\n with\n multiple\n lines */3')).to.equal(5);
      });

      it('should ignore whitespace', function () {
        expect(parser.evaluate(' 3\r + \n \t 4 ')).to.equal(7);
      });

      it('should accept variables starting with E', function () {
        expect(parser.parse('2 * ERGONOMIC').evaluate({ ERGONOMIC: 1000 })).to.equal(2000);
      });

      it('should accept variables starting with PI', function () {
        expect(parser.parse('1 / PITTSBURGH').evaluate({ PITTSBURGH: 2 })).to.equal(0.5);
      });

      it('should fail on empty parentheses', function () {
        expect(function () { parser.parse('5/()'); }).to.throw(Error);
      });

      it('should fail on 5/', function () {
        expect(function () { parser.parse('5/'); }).to.throw(Error);
      });

      it('should parse numbers', function () {
        expect(parser.evaluate('123')).to.equal(123);
        expect(parser.evaluate('123.')).to.equal(123);
        expect(parser.evaluate('123.456')).to.equal(123.456);
        expect(parser.evaluate('.456')).to.equal(0.456);
        expect(parser.evaluate('0.456')).to.equal(0.456);
        expect(parser.evaluate('0.')).to.equal(0);
        expect(parser.evaluate('.0')).to.equal(0);
        expect(parser.evaluate('123.+3')).to.equal(126);
        expect(parser.evaluate('2/123')).to.equal(2 / 123);
      });

      it('should parse numbers using scientific notation', function () {
        expect(parser.evaluate('123e2')).to.equal(12300);
        expect(parser.evaluate('123E2')).to.equal(12300);
        expect(parser.evaluate('123e12')).to.equal(123000000000000);
        expect(parser.evaluate('123e+12')).to.equal(123000000000000);
        expect(parser.evaluate('123E+12')).to.equal(123000000000000);
        expect(parser.evaluate('123e-12')).to.equal(0.000000000123);
        expect(parser.evaluate('123E-12')).to.equal(0.000000000123);
        expect(parser.evaluate('1.7e308')).to.equal(1.7e308);
        expect(parser.evaluate('1.7e-308')).to.equal(1.7e-308);
        expect(parser.evaluate('123.e3')).to.equal(123000);
        expect(parser.evaluate('123.456e+1')).to.equal(1234.56);
        expect(parser.evaluate('.456e-3')).to.equal(0.000456);
        expect(parser.evaluate('0.456')).to.equal(0.456);
        expect(parser.evaluate('0e3')).to.equal(0);
        expect(parser.evaluate('0e-3')).to.equal(0);
        expect(parser.evaluate('0e+3')).to.equal(0);
        expect(parser.evaluate('.0e+3')).to.equal(0);
        expect(parser.evaluate('.0e-3')).to.equal(0);
        expect(parser.evaluate('123e5+4')).to.equal(12300004);
        expect(parser.evaluate('123e+5+4')).to.equal(12300004);
        expect(parser.evaluate('123e-5+4')).to.equal(4.00123);
        expect(parser.evaluate('123e0')).to.equal(123);
        expect(parser.evaluate('123e01')).to.equal(1230);
        expect(parser.evaluate('123e+00000000002')).to.equal(12300);
        expect(parser.evaluate('123e-00000000002')).to.equal(1.23);
        expect(parser.evaluate('e1', { e1: 42 })).to.equal(42);
        expect(parser.evaluate('e+1', { e: 12 })).to.equal(13);
      });

      it('should fail on invalid numbers', function () {
        expect(function () { parser.parse('123..'); }).to.throw(Error);
        expect(function () { parser.parse('0..123'); }).to.throw(Error);
        expect(function () { parser.parse('0..'); }).to.throw(Error);
        expect(function () { parser.parse('.0.'); }).to.throw(Error);
        expect(function () { parser.parse('.'); }).to.throw(Error);
        expect(function () { parser.parse('1.23e'); }).to.throw(Error);
        expect(function () { parser.parse('1.23e+'); }).to.throw(Error);
        expect(function () { parser.parse('1.23e-'); }).to.throw(Error);
        expect(function () { parser.parse('1.23e++4'); }).to.throw(Error);
        expect(function () { parser.parse('1.23e--4'); }).to.throw(Error);
        expect(function () { parser.parse('1.23e+-4'); }).to.throw(Error);
        expect(function () { parser.parse('1.23e4-'); }).to.throw(Error);
        expect(function () { parser.parse('1.23ee4'); }).to.throw(Error);
        expect(function () { parser.parse('1.23ee.4'); }).to.throw(Error);
        expect(function () { parser.parse('1.23e4.0'); }).to.throw(Error);
        expect(function () { parser.parse('123e.4'); }).to.throw(Error);
      });

      it('should parse hexadecimal integers correctly', function () {
        expect(parser.evaluate('0x0')).to.equal(0x0);
        expect(parser.evaluate('0x1')).to.equal(0x1);
        expect(parser.evaluate('0xA')).to.equal(0xA);
        expect(parser.evaluate('0xF')).to.equal(0xF);
        expect(parser.evaluate('0x123')).to.equal(0x123);
        expect(parser.evaluate('0x123ABCD')).to.equal(0x123ABCD);
        expect(parser.evaluate('0xDEADBEEF')).to.equal(0xDEADBEEF);
        expect(parser.evaluate('0xdeadbeef')).to.equal(0xdeadbeef);
        expect(parser.evaluate('0xABCDEF')).to.equal(0xABCDEF);
        expect(parser.evaluate('0xabcdef')).to.equal(0xABCDEF);
        expect(parser.evaluate('0x1e+4')).to.equal(0x1e + 4);
        expect(parser.evaluate('0x1E+4')).to.equal(0x1e + 4);
        expect(parser.evaluate('0x1e-4')).to.equal(0x1e - 4);
        expect(parser.evaluate('0x1E-4')).to.equal(0x1e - 4);
        expect(parser.evaluate('0xFFFFFFFF')).to.equal(Math.pow(2, 32) - 1);
        expect(parser.evaluate('0x100000000')).to.equal(Math.pow(2, 32));
        expect(parser.evaluate('0x1FFFFFFFFFFFFF')).to.equal(Math.pow(2, 53) - 1);
        expect(parser.evaluate('0x20000000000000')).to.equal(Math.pow(2, 53));
      });

      it('should parse binary integers correctly', function () {
        expect(parser.evaluate('0b0')).to.equal(0);
        expect(parser.evaluate('0b1')).to.equal(1);
        expect(parser.evaluate('0b01')).to.equal(1);
        expect(parser.evaluate('0b10')).to.equal(2);
        expect(parser.evaluate('0b100')).to.equal(4);
        expect(parser.evaluate('0b101')).to.equal(5);
        expect(parser.evaluate('0b10101')).to.equal(21);
        expect(parser.evaluate('0b10111')).to.equal(23);
        expect(parser.evaluate('0b11111')).to.equal(31);
        expect(parser.evaluate('0b11111111111111111111111111111111')).to.equal(Math.pow(2, 32) - 1);
        expect(parser.evaluate('0b100000000000000000000000000000000')).to.equal(Math.pow(2, 32));
        expect(parser.evaluate('0b11111111111111111111111111111111111111111111111111111')).to.equal(Math.pow(2, 53) - 1);
        expect(parser.evaluate('0b100000000000000000000000000000000000000000000000000000')).to.equal(Math.pow(2, 53));
      });

      it('should fail on invalid hexadecimal numbers', function () {
        expect(function () { parser.parse('0x'); }).to.throw(Error);
        expect(function () { parser.parse('0x + 1'); }).to.throw(Error);
        expect(function () { parser.parse('0x1.23'); }).to.throw(Error);
        expect(function () { parser.parse('0xG'); }).to.throw(Error);
        expect(function () { parser.parse('0xx0'); }).to.throw(Error);
        expect(function () { parser.parse('0x1g'); }).to.throw(Error);
        expect(function () { parser.parse('1x0'); }).to.throw(Error);
      });

      it('should fail on invalid binary numbers', function () {
        expect(function () { parser.parse('0b'); }).to.throw(Error);
        expect(function () { parser.parse('0b + 1'); }).to.throw(Error);
        expect(function () { parser.parse('0b1.1'); }).to.throw(Error);
        expect(function () { parser.parse('0b2'); }).to.throw(Error);
        expect(function () { parser.parse('0bb0'); }).to.throw(Error);
        expect(function () { parser.parse('0b1e+1'); }).to.throw(Error);
        expect(function () { parser.parse('1b0'); }).to.throw(Error);
      });

      it('should fail on unknown characters', function () {
        expect(function () { parser.parse('1 + @'); }).to.throw(Error);
      });

      it('should fail with partial operators', function () {
        expect(function () { parser.parse('"a" | "b"'); }).to.throw(Error);
        expect(function () { parser.parse('2 = 2'); }).to.throw(Error);
        expect(function () { parser.parse('2 ! 3'); }).to.throw(Error);
        expect(function () { parser.parse('1 o 0'); }).to.throw(Error);
        expect(function () { parser.parse('1 an 2'); }).to.throw(Error);
        expect(function () { parser.parse('1 a 2'); }).to.throw(Error);
      });

      it('should parse strings', function () {
        expect(parser.evaluate('\'asdf\'')).to.equal('asdf');
        expect(parser.evaluate('"asdf"')).to.equal('asdf');
        expect(parser.evaluate('""')).to.equal('');
        expect(parser.evaluate('\'\'')).to.equal('');
        expect(parser.evaluate('"  "')).to.equal('  ');
        expect(parser.evaluate('"a\nb\tc"')).to.equal('a\nb\tc');
        expect(parser.evaluate('"Nested \'single quotes\'"')).to.equal('Nested \'single quotes\'');
        expect(parser.evaluate('\'Nested "double quotes"\'')).to.equal('Nested "double quotes"');
        expect(parser.evaluate('\'Single quotes \\\'inside\\\' single quotes\'')).to.equal('Single quotes \'inside\' single quotes');
        expect(parser.evaluate('"Double quotes \\"inside\\" double quotes"')).to.equal('Double quotes "inside" double quotes');
        expect(parser.evaluate('"\n"')).to.equal('\n');
        expect(parser.evaluate('"\\\'\\"\\\\\\/\\b\\f\\n\\r\\t\\u1234"')).to.equal('\'"\\/\b\f\n\r\t\u1234');
        expect(parser.evaluate('"\'\\"\\\\\\/\\b\\f\\n\\r\\t\\u1234"')).to.equal('\'"\\/\b\f\n\r\t\u1234');
        expect(parser.evaluate('\'\\\'\\"\\\\\\/\\b\\f\\n\\r\\t\\u1234\'')).to.equal('\'"\\/\b\f\n\r\t\u1234');
        expect(parser.evaluate('\'\\\'"\\\\\\/\\b\\f\\n\\r\\t\\u1234\'')).to.equal('\'"\\/\b\f\n\r\t\u1234');
        expect(parser.evaluate('"\\uFFFF"')).to.equal('\uFFFF');
        expect(parser.evaluate('"\\u0123"')).to.equal('\u0123');
        expect(parser.evaluate('"\\u4567"')).to.equal('\u4567');
        expect(parser.evaluate('"\\u89ab"')).to.equal('\u89ab');
        expect(parser.evaluate('"\\ucdef"')).to.equal('\ucdef');
        expect(parser.evaluate('"\\uABCD"')).to.equal('\uABCD');
        expect(parser.evaluate('"\\uEF01"')).to.equal('\uEF01');
        expect(parser.evaluate('"\\u11111"')).to.equal('\u11111');
      });

      it('should fail on bad strings', function () {
        expect(function () { parser.parse('\'asdf"'); }).to.throw(Error);
        expect(function () { parser.parse('"asdf\''); }).to.throw(Error);
        expect(function () { parser.parse('"asdf'); }).to.throw(Error);
        expect(function () { parser.parse('\'asdf'); }).to.throw(Error);
        expect(function () { parser.parse('\'asdf\\'); }).to.throw(Error);
        expect(function () { parser.parse('\''); }).to.throw(Error);
        expect(function () { parser.parse('"'); }).to.throw(Error);
        expect(function () { parser.parse('"\\x"'); }).to.throw(Error);
        expect(function () { parser.parse('"\\u123"'); }).to.throw(Error);
        expect(function () { parser.parse('"\\u12"'); }).to.throw(Error);
        expect(function () { parser.parse('"\\u1"'); }).to.throw(Error);
        expect(function () { parser.parse('"\\uGGGG"'); }).to.throw(Error);
      });

      it('should parse operators that look like functions as function calls', function () {
        expect(parser.parse('sin 2^3').toString()).to.equal('(sin (2 ^ 3))');
        expect(parser.parse('sin(2)^3').toString()).to.equal('((sin 2) ^ 3)');
        expect(parser.parse('sin 2^3').evaluate()).to.equal(Math.sin(Math.pow(2, 3)));
        expect(parser.parse('sin(2)^3').evaluate()).to.equal(Math.pow(Math.sin(2), 3));
      });

      it('unary + and - should not be parsed as function calls', function () {
        expect(parser.parse('-2^3').toString()).to.equal('(-(2 ^ 3))');
        expect(parser.parse('-(2)^3').toString()).to.equal('(-(2 ^ 3))');
      });

      it('should treat ∙ and • as * operators', function () {
        expect(parser.parse('2 ∙ 3').toString()).to.equal('(2 * 3)');
        expect(parser.parse('4 • 5').toString()).to.equal('(4 * 5)');
      });

      it('should parse variables that start with operators', function () {
        expect(parser.parse('org > 5').toString()).to.equal('(org > 5)');
        expect(parser.parse('android * 2').toString()).to.equal('(android * 2)');
        expect(parser.parse('single == 1').toString()).to.equal('(single == 1)');
      });

      it('should parse valid variable names correctly', function () {
        expect(parser.parse('a').variables()).to.deep.equal([ 'a' ]);
        expect(parser.parse('abc').variables()).to.deep.equal([ 'abc' ]);
        expect(parser.parse('a+b').variables()).to.deep.equal([ 'a', 'b' ]);
        expect(parser.parse('ab+c').variables()).to.deep.equal([ 'ab', 'c' ]);
        expect(parser.parse('a1').variables()).to.deep.equal([ 'a1' ]);
        expect(parser.parse('a_1').variables()).to.deep.equal([ 'a_1' ]);
        expect(parser.parse('a_').variables()).to.deep.equal([ 'a_' ]);
        expect(parser.parse('a_c').variables()).to.deep.equal([ 'a_c' ]);
        expect(parser.parse('A').variables()).to.deep.equal([ 'A' ]);
        expect(parser.parse('ABC').variables()).to.deep.equal([ 'ABC' ]);
        expect(parser.parse('A+B').variables()).to.deep.equal([ 'A', 'B' ]);
        expect(parser.parse('AB+C').variables()).to.deep.equal([ 'AB', 'C' ]);
        expect(parser.parse('A1').variables()).to.deep.equal([ 'A1' ]);
        expect(parser.parse('A_1').variables()).to.deep.equal([ 'A_1' ]);
        expect(parser.parse('A_C').variables()).to.deep.equal([ 'A_C' ]);
        expect(parser.parse('abcdefg/hijklmnop+qrstuvwxyz').variables()).to.deep.equal([ 'abcdefg', 'hijklmnop', 'qrstuvwxyz' ]);
        expect(parser.parse('ABCDEFG/HIJKLMNOP+QRSTUVWXYZ').variables()).to.deep.equal([ 'ABCDEFG', 'HIJKLMNOP', 'QRSTUVWXYZ' ]);
        expect(parser.parse('abc123+def456*ghi789/jkl0').variables()).to.deep.equal([ 'abc123', 'def456', 'ghi789', 'jkl0' ]);
        expect(parser.parse('$x').variables()).to.deep.equal([ '$x' ]);
        expect(parser.parse('$xyz').variables()).to.deep.equal([ '$xyz' ]);
        expect(parser.parse('$a_sdf').variables()).to.deep.equal([ '$a_sdf' ]);
        expect(parser.parse('$xyz_123').variables()).to.deep.equal([ '$xyz_123' ]);
      });

      it('should not parse invalid variables', function () {
        expect(function () { parser.parse('a$x'); }).to.throw(/parse error/);
        expect(function () { parser.parse('ab$'); }).to.throw(/parse error/);
      });

      it('should not parse a single $ as a variable', function () {
        expect(function () { parser.parse('$'); }).to.throw(/parse error/);
      });

      it('should not allow leading _ in variable names', function () {
        expect(function () { parser.parse('_'); }).to.throw(/parse error/);
        expect(function () { parser.parse('_ab'); }).to.throw(/parse error/);
      });

      it('should not allow leading digits in variable names', function () {
        expect(function () { parser.parse('1a'); }).to.throw(/parse error/);
        expect(function () { parser.parse('1_'); }).to.throw(/parse error/);
        expect(function () { parser.parse('1_a'); }).to.throw(/parse error/);
      });

      it('should not allow leading digits or _ after $ in variable names', function () {
        expect(function () { parser.parse('$0'); }).to.throw(/parse error/);
        expect(function () { parser.parse('$1a'); }).to.throw(/parse error/);
        expect(function () { parser.parse('$_'); }).to.throw(/parse error/);
        expect(function () { parser.parse('$_x'); }).to.throw(/parse error/);
      });

      it('should track token positions correctly', function () {
        expect(function () { parser.parse('@23'); }).to.throw(/parse error \[1:1]/);
        expect(function () { parser.parse('\n@23'); }).to.throw(/parse error \[2:1]/);
        expect(function () { parser.parse('1@3'); }).to.throw(/parse error \[1:2]/);
        expect(function () { parser.parse('12@'); }).to.throw(/parse error \[1:3]/);
        expect(function () { parser.parse('12@\n'); }).to.throw(/parse error \[1:3]/);
        expect(function () { parser.parse('@23 +\n45 +\n6789'); }).to.throw(/parse error \[1:1]/);
        expect(function () { parser.parse('1@3 +\n45 +\n6789'); }).to.throw(/parse error \[1:2]/);
        expect(function () { parser.parse('12@ +\n45 +\n6789'); }).to.throw(/parse error \[1:3]/);
        expect(function () { parser.parse('123 +\n@5 +\n6789'); }).to.throw(/parse error \[2:1]/);
        expect(function () { parser.parse('123 +\n4@ +\n6789'); }).to.throw(/parse error \[2:2]/);
        expect(function () { parser.parse('123 +\n45@+\n6789'); }).to.throw(/parse error \[2:3]/);
        expect(function () { parser.parse('123 +\n45 +\n@789'); }).to.throw(/parse error \[3:1]/);
        expect(function () { parser.parse('123 +\n45 +\n6@89'); }).to.throw(/parse error \[3:2]/);
        expect(function () { parser.parse('123 +\n45 +\n67@9'); }).to.throw(/parse error \[3:3]/);
        expect(function () { parser.parse('123 +\n45 +\n679@'); }).to.throw(/parse error \[3:4]/);
        expect(function () { parser.parse('123 +\n\n679@'); }).to.throw(/parse error \[3:4]/);
        expect(function () { parser.parse('123 +\n\n\n\n\n679@'); }).to.throw(/parse error \[6:4]/);
      });

      it('should allow operators to be disabled', function () {
        var parser = new Parser({
          operators: {
            add: false,
            sin: false,
            remainder: false,
            divide: false
          }
        });
        expect(function () { parser.parse('+1'); }).to.throw(/\+/);
        expect(function () { parser.parse('1 + 2'); }).to.throw(/\+/);
        expect(parser.parse('sin(0)').toString()).to.equal('sin(0)');
        expect(function () { parser.evaluate('sin(0)'); }).to.throw(/sin/);
        expect(function () { parser.parse('4 % 5'); }).to.throw(/%/);
        expect(function () { parser.parse('4 / 5'); }).to.throw(/\//);
      });

      it('should allow operators to be explicitly enabled', function () {
        var parser = new Parser({
          operators: {
            add: true,
            sqrt: true,
            divide: true,
            'in': true
          }
        });
        expect(parser.evaluate('+(-1)')).to.equal(-1);
        expect(parser.evaluate('sqrt(16)')).to.equal(4);
        expect(parser.evaluate('4 / 6')).to.equal(2 / 3);
        expect(parser.evaluate('3 in array', { array: [ 1, 2, 3 ] })).to.equal(true);
      });
    });
  });

  it('should disallow member access', function () {
    var parser = new Parser({ allowMemberAccess: false });
    expect(function () { parser.evaluate('min.bind'); }).to.throw(/member access is not permitted/);
    expect(function () { parser.evaluate('min.bind()'); }).to.throw(/member access is not permitted/);
    expect(function () { parser.evaluate('32 + min.bind'); }).to.throw(/member access is not permitted/);
    expect(function () { parser.evaluate('a.b', { a: { b: 2 } }); }).to.throw(/member access is not permitted/);
  });
});

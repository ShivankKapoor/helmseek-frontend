import { describe, expect, it } from 'vitest';
import { evaluateExpression } from './calculator';

describe('evaluateExpression', () => {
	it.each([
		['2+3', '5'],
		['2+3*4', '14'],
		['(2+3)*4', '20'],
		['10/4', '2.5'],
		['10 - 4 - 3', '3'],
		['2 * (3 + (4 - 1))', '12'],
		['-5+2', '-3'],
		['2*-3', '-6'],
		['+7', '7'],
		['.5+.5', '1'],
		['3.', '3']
	])('evaluates %s to %s', (expression, expected) => {
		expect(evaluateExpression(expression)).toBe(expected);
	});

	it('rounds floating point noise to 10 decimal places', () => {
		expect(evaluateExpression('0.1+0.2')).toBe('0.3');
		expect(evaluateExpression('1/3')).toBe('0.3333333333');
	});

	it.each([
		['empty input', ''],
		['letters', 'abc'],
		['exponent operator', '2**3'],
		['caret', '2^3'],
		['dangling operator', '2+'],
		['unbalanced open parenthesis', '(2+3'],
		['unbalanced close parenthesis', '2+3)'],
		['two decimal points', '1.2.3'],
		['empty parentheses', '()'],
		['code injection attempt', 'alert(1)'],
		['division by zero', '1/0'],
		['zero divided by zero', '0/0']
	])('returns null for %s', (_label, expression) => {
		expect(evaluateExpression(expression)).toBeNull();
	});
});

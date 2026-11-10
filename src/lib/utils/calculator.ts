/**
 * Evaluates a basic arithmetic expression (+ - * / parentheses, decimals, unary signs).
 * Returns the formatted result, or null when the input isn't a valid expression.
 *
 * A small recursive-descent parser is used instead of eval/new Function so the search box
 * never executes user input as code.
 */
const ALLOWED_CHARACTERS = /^[\d+\-*/.()]+$/;
const NUMBER = /\d+\.?\d*|\.\d+/y;
const MAX_DECIMAL_PLACES = 10;

export function evaluateExpression(input: string): string | null {
	const source = input.replace(/\s/g, '');
	if (!ALLOWED_CHARACTERS.test(source)) return null;

	let position = 0;

	function parseExpression(): number {
		let value = parseTerm();
		while (source[position] === '+' || source[position] === '-') {
			const operator = source[position++];
			const right = parseTerm();
			value = operator === '+' ? value + right : value - right;
		}
		return value;
	}

	function parseTerm(): number {
		let value = parseFactor();
		while (source[position] === '*' || source[position] === '/') {
			const operator = source[position++];
			const right = parseFactor();
			value = operator === '*' ? value * right : value / right;
		}
		return value;
	}

	function parseFactor(): number {
		const character = source[position];
		if (character === '-') { position++; return -parseFactor(); }
		if (character === '+') { position++; return parseFactor(); }
		if (character === '(') {
			position++;
			const value = parseExpression();
			if (source[position++] !== ')') throw new SyntaxError('Missing closing parenthesis');
			return value;
		}
		return parseNumber();
	}

	function parseNumber(): number {
		NUMBER.lastIndex = position;
		const match = NUMBER.exec(source);
		if (!match) throw new SyntaxError('Expected a number');
		position += match[0].length;
		return Number(match[0]);
	}

	try {
		const result = parseExpression();
		if (position !== source.length || !Number.isFinite(result)) return null;
		return Number.isInteger(result) ? String(result) : String(parseFloat(result.toFixed(MAX_DECIMAL_PLACES)));
	} catch {
		return null;
	}
}

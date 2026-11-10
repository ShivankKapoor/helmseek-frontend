import { beforeEach, describe, expect, it } from 'vitest';
import { FONT_OPTIONS } from '@/lib/types/config';
import { applyAppearance, applyTheme, fontStylesheetUrl } from './applyTheme';

const theme = (overrides: Partial<Parameters<typeof applyTheme>[0]> = {}) => ({
	selectedColor: '#1a73e8,#155ab6',
	themeMode: 'light' as const,
	fontFamily: 'Fira Code',
	...overrides
});

const cssVar = (name: string) => document.documentElement.style.getPropertyValue(name);
const fontLinks = () => document.querySelectorAll('link#google-fonts');

beforeEach(() => {
	document.head.innerHTML = '';
	document.body.className = '';
	document.documentElement.removeAttribute('style');
});

describe('fontStylesheetUrl', () => {
	it('builds a Google Fonts URL with the weights the app uses', () => {
		expect(fontStylesheetUrl('Sora')).toBe(
			'https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600&display=swap'
		);
	});

	it('joins multi-word names with plus signs', () => {
		expect(fontStylesheetUrl('IBM Plex Mono')).toContain('family=IBM+Plex+Mono:');
	});
});

describe('applyAppearance', () => {
	it('sets the colors and dark mode', () => {
		applyAppearance({ selectedColor: '#34a853,#2e7d32', themeMode: 'dark' });
		expect(cssVar('--button-bg')).toBe('#34a853');
		expect(document.body).toHaveClass('dark');
	});

	it('leaves the font alone, so the first paint is not affected by it', () => {
		applyAppearance({ selectedColor: '#34a853,#2e7d32', themeMode: 'dark' });
		expect(cssVar('--font-family')).toBe('');
		expect(fontLinks()).toHaveLength(0);
	});
});

describe('applyTheme', () => {
	it('sets the primary, hover and rgb color variables', () => {
		applyTheme(theme({ selectedColor: '#34a853,#2e7d32' }));
		expect(cssVar('--button-bg')).toBe('#34a853');
		expect(cssVar('--button-hover')).toBe('#2e7d32');
		expect(cssVar('--button-bg-rgb')).toBe('52, 168, 83');
	});

	it('uses the primary color for hover when no secondary is given', () => {
		applyTheme(theme({ selectedColor: '#34a853' }));
		expect(cssVar('--button-hover')).toBe('#34a853');
	});

	it('toggles the dark class', () => {
		applyTheme(theme({ themeMode: 'dark' }));
		expect(document.body).toHaveClass('dark');
		applyTheme(theme({ themeMode: 'light' }));
		expect(document.body).not.toHaveClass('dark');
	});

	it('sets the font stack with the right generic fallback', () => {
		applyTheme(theme({ fontFamily: 'Fraunces' }));
		expect(cssVar('--font-family')).toBe('"Fraunces", serif');
		applyTheme(theme({ fontFamily: 'Inter' }));
		expect(cssVar('--font-family')).toBe('"Inter", sans-serif');
	});

	it('falls back to the default font for an unknown name', () => {
		applyTheme(theme({ fontFamily: 'Comic Sans' }));
		expect(cssVar('--font-family')).toBe('"Fira Code", monospace');
		expect(document.getElementById('google-fonts')).toHaveAttribute('href', fontStylesheetUrl('Fira Code'));
	});

	it('adds one font stylesheet and updates it when the font changes', () => {
		applyTheme(theme({ fontFamily: 'Sora' }));
		applyTheme(theme({ fontFamily: 'Sora' }));
		expect(fontLinks()).toHaveLength(1);

		applyTheme(theme({ fontFamily: 'Nunito' }));
		expect(fontLinks()).toHaveLength(1);
		expect(document.getElementById('google-fonts')).toHaveAttribute('href', fontStylesheetUrl('Nunito'));
	});

	it('does not touch the stylesheet again when the font has not changed', () => {
		applyTheme(theme({ fontFamily: 'Sora' }));
		const link = document.getElementById('google-fonts')!;
		const writes: string[] = [];
		new MutationObserver((records) => records.forEach((r) => writes.push(r.attributeName!))).observe(link, { attributes: true });

		applyTheme(theme({ fontFamily: 'Sora' }));
		return Promise.resolve().then(() => expect(writes).toEqual([]));
	});
});

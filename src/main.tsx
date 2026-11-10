import { render } from 'preact';
import '@/app.css';
import { App } from '@/App';
import { config, loadConfig } from '@/lib/state/config';
import { applyAppearance } from '@/lib/theme/applyTheme';

// Show the locally saved config from the first paint. Colors and dark mode are applied before the
// first render so a dark-mode user never sees a flash of the light theme.
//
// The font is deliberately NOT applied here; the app applies it right after rendering. Painting the
// first frame in the saved web font's fallback makes the text grow when the font loads, and the
// browser then reports that later repaint as the Largest Contentful Paint (measured: LCP 1.4 s -> 3.0 s).
loadConfig();
applyAppearance(config.value);

render(<App />, document.getElementById('app')!);

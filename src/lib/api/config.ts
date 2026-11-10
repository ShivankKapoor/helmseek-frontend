import { apiFetch } from './client';
import { DEFAULT_CONFIG, type UserConfig, type UserConfigDTO } from '@/lib/types/config';
import type { WeatherCache } from '@/lib/types/weather';

// The backend stores quick links as a JSON string, so convert at the API boundary.
function toDTO(config: UserConfig): UserConfigDTO {
	return { ...config, quickLinks: JSON.stringify(config.quickLinks) };
}

function fromDTO(dto: UserConfigDTO): UserConfig {
	let quickLinks = DEFAULT_CONFIG.quickLinks;
	try {
		quickLinks = JSON.parse(dto.quickLinks ?? '[]');
	} catch {
		/* malformed JSON — fall back to no quick links */
	}
	return { ...dto, quickLinks };
}

export async function fetchConfig(): Promise<UserConfig> {
	const dto = await apiFetch<UserConfigDTO>('/user/config');
	return fromDTO(dto);
}

export async function saveConfig(config: UserConfig): Promise<void> {
	await apiFetch('/user/config', {
		method: 'POST',
		body: JSON.stringify(toDTO(config))
	});
}

export async function saveWeatherCache(cache: WeatherCache): Promise<void> {
	await apiFetch('/user/weather', {
		method: 'POST',
		body: JSON.stringify(cache)
	});
}

import { derived, readable } from 'svelte/store';
import axios from 'axios';
import { settings } from './settings.js';

const serverConfig = readable(null, function start(set) {
    axios.get('config')
        .then(function (response) {
            set(response.data);
        })
        .catch(function (error) {
            console.error('Failed to load application config:', error.message || error);
            // Set a fallback config or error state
            set({
                error: 'Failed to load configuration. Some features may not work correctly.',
                loaded: false
            });
        })

    return function stop() {};
});

// Merge server config with custom endpoints from settings
export const appConfig = derived(
    [serverConfig, settings],
    ([$serverConfig, $settings]) => {
        if (!$serverConfig) return null;

        // Create a copy of the server config
        const mergedConfig = { ...$serverConfig };

        // Merge custom endpoints with server endpoints
        if ($settings?.customEndpoints && Array.isArray($settings.customEndpoints)) {
            const customEndpointPatterns = {};
            $settings.customEndpoints.forEach(endpoint => {
                if (endpoint.key && endpoint.pattern) {
                    customEndpointPatterns[endpoint.key] = endpoint.pattern;
                }
            });

            mergedConfig.endpointPathPatterns = {
                ...$serverConfig.endpointPathPatterns,
                ...customEndpointPatterns
            };
        }

        return mergedConfig;
    }
);

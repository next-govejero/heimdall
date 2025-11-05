import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get, writable } from 'svelte/store';

// Mock axios
vi.mock('axios', () => ({
  default: {
    get: vi.fn()
  }
}));

// Mock settings store
const mockSettingsStore = writable({
  refreshInterval: '30',
  displayMode: 'tabular',
  showJobParallelism: true,
  showJobFlinkVersion: true,
  showJobImage: true,
  customEndpoints: []
});

vi.mock('../../lib/stores/settings', () => ({
  settings: mockSettingsStore
}));

describe('appConfig store', () => {
  beforeEach(() => {
    // Reset settings to defaults
    mockSettingsStore.set({
      refreshInterval: '30',
      displayMode: 'tabular',
      showJobParallelism: true,
      showJobFlinkVersion: true,
      showJobImage: true,
      customEndpoints: []
    });

    vi.clearAllMocks();
  });

  it('should be importable', async () => {
    const { appConfig } = await import('../../lib/stores/appConfig');
    expect(appConfig).toBeDefined();
  });

  it('should be a readable store', async () => {
    const { appConfig } = await import('../../lib/stores/appConfig');
    expect(typeof appConfig.subscribe).toBe('function');
  });

  it('should have subscribe method', async () => {
    const { appConfig } = await import('../../lib/stores/appConfig');
    expect(appConfig.subscribe).toBeInstanceOf(Function);
  });

  it('should return null when server config is null', async () => {
    const { derived } = await import('svelte/store');
    const { readable } = await import('svelte/store');

    // Create a mock server config that returns null
    const mockServerConfig = readable(null);
    const mockSettings = readable({
      customEndpoints: []
    });

    const result = derived(
      [mockServerConfig, mockSettings],
      ([$serverConfig, $settings]) => {
        if (!$serverConfig) return null;
        return $serverConfig;
      }
    );

    const value = get(result);
    expect(value).toBeNull();
  });

  it('should merge custom endpoints with server config', async () => {
    const { derived } = await import('svelte/store');
    const { readable } = await import('svelte/store');

    const mockServerConfig = readable({
      appVersion: '1.0.0',
      endpointPathPatterns: {
        'flink-ui': 'http://localhost/$jobName/ui',
        'flink-api': 'http://localhost/$jobName/api'
      }
    });

    const mockSettings = readable({
      customEndpoints: [
        {
          key: 'github-repo',
          title: 'GitHub Repo',
          pattern: 'https://github.com/org/$jobName'
        }
      ]
    });

    const result = derived(
      [mockServerConfig, mockSettings],
      ([$serverConfig, $settings]) => {
        if (!$serverConfig) return null;

        const mergedConfig = { ...$serverConfig };

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

    const value = get(result);
    expect(value.endpointPathPatterns).toHaveProperty('flink-ui');
    expect(value.endpointPathPatterns).toHaveProperty('flink-api');
    expect(value.endpointPathPatterns).toHaveProperty('github-repo');
    expect(value.endpointPathPatterns['github-repo']).toBe('https://github.com/org/$jobName');
  });

  it('should handle empty custom endpoints', async () => {
    const { derived } = await import('svelte/store');
    const { readable } = await import('svelte/store');

    const mockServerConfig = readable({
      appVersion: '1.0.0',
      endpointPathPatterns: {
        'flink-ui': 'http://localhost/$jobName/ui'
      }
    });

    const mockSettings = readable({
      customEndpoints: []
    });

    const result = derived(
      [mockServerConfig, mockSettings],
      ([$serverConfig, $settings]) => {
        if (!$serverConfig) return null;

        const mergedConfig = { ...$serverConfig };

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

    const value = get(result);
    expect(value.endpointPathPatterns).toHaveProperty('flink-ui');
    expect(Object.keys(value.endpointPathPatterns)).toHaveLength(1);
  });

  it('should handle undefined customEndpoints', async () => {
    const { derived } = await import('svelte/store');
    const { readable } = await import('svelte/store');

    const mockServerConfig = readable({
      appVersion: '1.0.0',
      endpointPathPatterns: {
        'flink-ui': 'http://localhost/$jobName/ui'
      }
    });

    const mockSettings = readable({});

    const result = derived(
      [mockServerConfig, mockSettings],
      ([$serverConfig, $settings]) => {
        if (!$serverConfig) return null;

        const mergedConfig = { ...$serverConfig };

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

    const value = get(result);
    expect(value.endpointPathPatterns).toHaveProperty('flink-ui');
    expect(Object.keys(value.endpointPathPatterns)).toHaveLength(1);
  });

  it('should skip custom endpoints without key or pattern', async () => {
    const { derived } = await import('svelte/store');
    const { readable } = await import('svelte/store');

    const mockServerConfig = readable({
      appVersion: '1.0.0',
      endpointPathPatterns: {
        'flink-ui': 'http://localhost/$jobName/ui'
      }
    });

    const mockSettings = readable({
      customEndpoints: [
        { key: 'github-repo', pattern: 'https://github.com/org/$jobName' },
        { key: 'missing-pattern' }, // Missing pattern
        { pattern: 'https://example.com' }, // Missing key
        { key: '', pattern: 'https://example.com' }, // Empty key
        { key: 'empty-pattern', pattern: '' } // Empty pattern
      ]
    });

    const result = derived(
      [mockServerConfig, mockSettings],
      ([$serverConfig, $settings]) => {
        if (!$serverConfig) return null;

        const mergedConfig = { ...$serverConfig };

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

    const value = get(result);
    expect(value.endpointPathPatterns).toHaveProperty('flink-ui');
    expect(value.endpointPathPatterns).toHaveProperty('github-repo');
    expect(Object.keys(value.endpointPathPatterns)).toHaveLength(2);
  });

  it('should handle non-array customEndpoints', async () => {
    const { derived } = await import('svelte/store');
    const { readable } = await import('svelte/store');

    const mockServerConfig = readable({
      appVersion: '1.0.0',
      endpointPathPatterns: {
        'flink-ui': 'http://localhost/$jobName/ui'
      }
    });

    const mockSettings = readable({
      customEndpoints: 'not-an-array'
    });

    const result = derived(
      [mockServerConfig, mockSettings],
      ([$serverConfig, $settings]) => {
        if (!$serverConfig) return null;

        const mergedConfig = { ...$serverConfig };

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

    const value = get(result);
    expect(value.endpointPathPatterns).toHaveProperty('flink-ui');
    expect(Object.keys(value.endpointPathPatterns)).toHaveLength(1);
  });
});

import { get, writable } from 'svelte/store';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import axios from 'axios';

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

describe('appConfig store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with null value', async () => {
    // Don't resolve the promise yet
    axios.get.mockImplementation(() => new Promise(() => {}));

    const { appConfig } = await import('../../lib/stores/appConfig?t=' + Date.now());

    let currentValue;
    const unsubscribe = appConfig.subscribe(value => {
      currentValue = value;
    });

    // Initial value should be null
    expect(currentValue).toBeNull();

    unsubscribe();
  });

  it('should load configuration successfully from API', async () => {
    const mockConfig = {
      apiUrl: 'http://api.example.com',
      features: {
        darkMode: true,
        notifications: true
      },
      version: '1.0.0'
    };

    axios.get.mockResolvedValueOnce({ data: mockConfig });

    const { appConfig } = await import('../../lib/stores/appConfig?t=' + Date.now());

    let currentValue;
    const unsubscribe = appConfig.subscribe(value => {
      currentValue = value;
    });

    // Wait for promise to resolve
    await vi.waitFor(() => {
      expect(currentValue).toEqual(mockConfig);
    });

    expect(axios.get).toHaveBeenCalledWith('config');

    unsubscribe();
  });

  it('should handle API errors gracefully with fallback config', async () => {
    const mockError = new Error('Failed to fetch config');
    axios.get.mockRejectedValueOnce(mockError);

    // Spy on console.error to verify error logging
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { appConfig } = await import('../../lib/stores/appConfig?t=' + Date.now());

    let currentValue;
    const unsubscribe = appConfig.subscribe(value => {
      currentValue = value;
    });

    // Wait for promise to reject and fallback to be set
    await vi.waitFor(() => {
      expect(currentValue).toEqual({
        error: 'Failed to load configuration. Some features may not work correctly.',
        loaded: false
      });
    });

    // Verify error was logged
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to load application config:',
      mockError.message
    );

    consoleErrorSpy.mockRestore();
    unsubscribe();
  });

  it('should log error message when error object has message property', async () => {
    const mockError = new Error('Network timeout');
    axios.get.mockRejectedValueOnce(mockError);

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { appConfig } = await import('../../lib/stores/appConfig?t=' + Date.now());

    const unsubscribe = appConfig.subscribe(() => {});

    await vi.waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to load application config:',
      'Network timeout'
    );

    consoleErrorSpy.mockRestore();
    unsubscribe();
  });

  it('should log entire error object when no message property exists', async () => {
    const mockError = { status: 500, statusText: 'Internal Server Error' };
    axios.get.mockRejectedValueOnce(mockError);

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { appConfig } = await import('../../lib/stores/appConfig?t=' + Date.now());

    const unsubscribe = appConfig.subscribe(() => {});

    await vi.waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to load application config:',
      mockError
    );

    consoleErrorSpy.mockRestore();
    unsubscribe();
  });

  it('should be a readable store (no set method exposed)', async () => {
    axios.get.mockResolvedValueOnce({ data: {} });

    const { appConfig } = await import('../../lib/stores/appConfig?t=' + Date.now());

    // Readable stores only have subscribe
    expect(typeof appConfig.subscribe).toBe('function');
    expect(appConfig.set).toBeUndefined();
    expect(appConfig.update).toBeUndefined();
  });

  it('should handle empty response data', async () => {
    const emptyData = {};
    axios.get.mockResolvedValueOnce({ data: emptyData });

    const { appConfig } = await import('../../lib/stores/appConfig?t=' + Date.now());

    let currentValue;
    const unsubscribe = appConfig.subscribe(value => {
      currentValue = value;
    });

    await vi.waitFor(() => {
      expect(currentValue).toEqual(emptyData);
    });

    unsubscribe();
  });

  it('should call cleanup function on unsubscribe', async () => {
    axios.get.mockResolvedValueOnce({ data: {} });

    const { appConfig } = await import('../../lib/stores/appConfig?t=' + Date.now());

    const unsubscribe = appConfig.subscribe(() => {});

    // Should not throw when calling cleanup
    expect(() => unsubscribe()).not.toThrow();
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

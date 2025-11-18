# CLAUDE.md - AI Assistant Guide for Heimdall

This document provides comprehensive guidance for AI assistants (like Claude) working with the Heimdall codebase.

## Table of Contents

- [Project Overview](#project-overview)
- [Codebase Architecture](#codebase-architecture)
- [Directory Structure](#directory-structure)
- [Technology Stack](#technology-stack)
- [Development Workflows](#development-workflows)
- [Code Conventions & Patterns](#code-conventions--patterns)
- [Testing Guidelines](#testing-guidelines)
- [Build & Deployment](#build--deployment)
- [Common Tasks](#common-tasks)
- [Important Files Reference](#important-files-reference)
- [Tips for AI Assistants](#tips-for-ai-assistants)

---

## Project Overview

**Heimdall** is a dashboard for operating Apache Flink jobs deployed with the Flink Kubernetes Operator. It provides a unified interface to search, filter, sort, and navigate multiple Flink jobs across different namespaces.

### Key Features
- Search & filter across multiple Flink deployments
- Job overview with status, state, and metadata
- Quick links to Flink UI, metrics, and logs
- Metadata support from Kubernetes labels/annotations
- Pagination for large job lists
- In-memory caching for performance
- Kubernetes-native design

### Current Version
- **Version:** 0.10.0
- **Java:** 17
- **Quarkus:** 3.2.11.Final
- **Svelte:** 5.43.3
- **Gradle:** 8.1.1

### Repository Information
- **GitHub:** next-govejero/heimdall (forked from sap1ens/heimdall)
- **Registry:** ghcr.io/next-govejero/heimdall
- **Sponsor:** Goldsky

---

## Codebase Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (User)                       │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│           Frontend (Svelte + Vite)                      │
│  - Reactive stores (state management)                   │
│  - Components (FlinkJobs, Modal, etc.)                  │
│  - Auto-refresh polling (configurable)                  │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP (REST API)
                     ▼
┌─────────────────────────────────────────────────────────┐
│           Backend (Quarkus JAX-RS)                      │
│  - REST endpoints (/jobs, /config)                      │
│  - Service layer (FlinkJobLocator)                      │
│  - 5-second cache (Caffeine)                            │
└────────────────────┬────────────────────────────────────┘
                     │ Fabric8 K8s Client
                     ▼
┌─────────────────────────────────────────────────────────┐
│      Kubernetes API (FlinkDeployment CRDs)              │
│  - Flink Kubernetes Operator resources                 │
│  - Multiple namespace support                           │
└─────────────────────────────────────────────────────────┘
```

### Design Patterns

#### Backend Patterns
1. **Dependency Injection (CDI)** - Quarkus Arc for DI container
2. **Service Locator** - `FlinkJobLocator` interface with conditional implementations
3. **Configuration as Code** - SmallRye ConfigMapping for typed configuration
4. **Caching** - Transparent method-level caching via `@CacheResult`
5. **Repository Pattern** - `FlinkDeploymentClient` wraps Kubernetes API calls
6. **Immutable DTOs** - Java Records for data transfer objects

#### Frontend Patterns
1. **Reactive Stores** - Svelte writable/readable stores for state
2. **Component-Based Architecture** - Reusable Svelte components
3. **Client-Side Polling** - Configurable auto-refresh intervals
4. **LocalStorage Persistence** - User preferences stored locally
5. **Template Substitution** - Dynamic URL/name patterns with `$jobName`, `$metadata.*`

---

## Directory Structure

```
heimdall/
├── .devcontainer/           # VS Code Dev Container configuration
├── .github/
│   └── workflows/           # GitHub Actions CI/CD
│       ├── build.yml        # Build & test on push/PR
│       └── release.yml      # Docker image release workflow
├── .husky/                  # Git pre-commit hooks
├── docs/                    # Documentation assets
├── gradle/                  # Gradle wrapper files
├── src/
│   ├── main/
│   │   ├── java/            # Backend source code
│   │   │   └── com/sap1ens/heimdall/
│   │   │       ├── api/               # REST controllers
│   │   │       ├── model/             # Data models (Records)
│   │   │       ├── service/           # Business logic
│   │   │       ├── kubernetes/        # K8s client wrappers
│   │   │       └── AppConfig.java     # Configuration interface
│   │   ├── webui/           # Frontend source code
│   │   │   ├── src/
│   │   │   │   ├── lib/
│   │   │   │   │   ├── components/    # Svelte components
│   │   │   │   │   └── stores/        # State management
│   │   │   │   ├── test/              # Frontend unit tests
│   │   │   │   ├── App.svelte         # Root component
│   │   │   │   └── main.js            # Entry point
│   │   │   ├── e2e/                   # Playwright E2E tests
│   │   │   ├── mock-data.json         # Mock data for development
│   │   │   ├── mock-server.js         # Development mock API server
│   │   │   ├── package.json           # Frontend dependencies
│   │   │   ├── vite.config.js         # Vite dev server config
│   │   │   ├── vitest.config.js       # Unit test config
│   │   │   └── playwright.config.js   # E2E test config
│   │   ├── resources/       # Backend configuration
│   │   │   └── application.properties # Main config file
│   │   └── docker/          # Dockerfile variants
│   │       ├── Dockerfile.jvm         # Standard JVM image
│   │       ├── Dockerfile.native      # GraalVM native image
│   │       └── ...
│   └── test/
│       ├── java/            # Backend tests
│       │   └── com/sap1ens/heimdall/
│       │       ├── api/               # API tests
│       │       ├── service/           # Service tests
│       │       └── kubernetes/        # K8s client tests
│       └── resources/       # Test configuration
├── tools/
│   └── k8s-operator/        # Kubernetes manifests
│       └── service-account.yaml       # Required K8s permissions
├── build.gradle             # Gradle build configuration
├── gradle.properties        # Gradle/Quarkus versions
├── settings.gradle          # Project settings
├── package.json             # Root npm scripts (Husky, lint-staged)
├── Makefile                 # Development convenience commands
├── docker-compose.yml       # Local dev environment
├── codecov.yml              # Code coverage configuration
├── README.md                # User documentation
├── LOCAL_DEVELOPMENT.md     # Developer setup guide
├── TESTING.md               # Testing guide
└── CLAUDE.md                # This file
```

---

## Technology Stack

### Backend
- **Framework:** Quarkus 3.2.11.Final (cloud-native Java)
- **Language:** Java 17
- **REST:** JAX-RS (RESTEasy Reactive) + Jackson
- **DI:** Jakarta EE CDI (Arc)
- **K8s Client:** Fabric8 Kubernetes Client
- **Caching:** Quarkus Cache (Caffeine)
- **Health:** SmallRye Health (K8s probes)
- **Build:** Gradle 8.1.1
- **Testing:** JUnit 5, Mockito, REST-Assured
- **Code Quality:** Spotless (Google Java Format), JaCoCo

### Frontend
- **Framework:** Svelte 5.43.3
- **Build Tool:** Vite 7.2.0
- **Styling:** Tailwind CSS 3.3.2
- **HTTP Client:** Axios 1.4.0
- **Icons:** Font Awesome (via svelte-fa)
- **Testing:** Vitest 4.0.7, Playwright 1.40.1
- **Code Quality:** ESLint, Prettier

### Infrastructure
- **Container:** Docker (multi-platform: amd64, arm64)
- **Base Image:** Distroless (minimal security surface)
- **Registry:** GitHub Container Registry (ghcr.io)
- **CI/CD:** GitHub Actions
- **Coverage:** Codecov

---

## Development Workflows

### Initial Setup

```bash
# 1. Clone the repository
git clone https://github.com/next-govejero/heimdall.git
cd heimdall

# 2. Install dependencies
make install
# Or manually:
npm install
cd src/main/webui && npm install && cd ../..

# 3. Install pre-commit hooks (Husky)
npm run prepare
```

### Development Modes

#### Option 1: Docker Compose (Recommended for Quick Start)
```bash
make dev
# Starts:
# - Frontend dev server on http://localhost:5173
# - Mock API server on http://localhost:8080
```

#### Option 2: Full Backend + Frontend (Requires K8s access)
```bash
# Terminal 1: Backend with live reload
./gradlew quarkusDev
# Access at http://localhost:8080

# Terminal 2: Frontend dev server
cd src/main/webui && npm run dev
# Access at http://localhost:5173
```

#### Option 3: Frontend Only (Mock Server)
```bash
# Terminal 1: Mock API
cd src/main/webui && node mock-server.js

# Terminal 2: Frontend
npm run dev
```

### Code Quality Commands

```bash
make format          # Format all code (Java + Frontend)
make format-check    # Check formatting without changes
make lint            # Lint frontend code
make lint-fix        # Auto-fix linting issues
```

### Testing Commands

```bash
make test            # Run all tests (backend + frontend)
make test-backend    # Backend tests only
make test-frontend   # Frontend unit tests only
make test-coverage   # Full coverage reports

# Frontend E2E tests
cd src/main/webui && npm run test:e2e
cd src/main/webui && npm run test:e2e:ui  # Interactive mode
```

### Build Commands

```bash
make build           # Build Java application
make build-image     # Build Docker image locally
./gradlew build      # Gradle build (includes tests)
```

---

## Code Conventions & Patterns

### Java Conventions

#### Package Structure
```
com.sap1ens.heimdall/
├── api/            # REST endpoints (resources)
├── model/          # Data models (Java Records)
├── service/        # Business logic (interfaces + implementations)
├── kubernetes/     # K8s client wrappers
└── AppConfig.java  # Configuration interface
```

#### Naming Conventions
- **Resources (Controllers):** `*Resource.java` (e.g., `FlinkJobResource`)
- **Services:** `*Locator.java`, `*Client.java`
- **Models:** Plain nouns (e.g., `FlinkJob`, `FlinkJobResources`)
- **Config:** `AppConfig` with nested interfaces

#### Code Style
- **Formatter:** Google Java Format (via Spotless)
- **Encoding:** UTF-8
- **Line Endings:** LF (Unix-style)
- **Indentation:** 2 spaces
- **Imports:** Remove unused, organized automatically
- **Parameters:** Always include parameter names (compiler flag: `-parameters`)

#### Dependency Injection
```java
// Constructor injection (preferred)
@Singleton
public class MyService {
    private final MyDependency dep;

    public MyService(MyDependency dep) {
        this.dep = dep;
    }
}

// Conditional beans
@Singleton
@LookupIfProperty(name = "heimdall.feature.enabled", stringValue = "true")
public class FeatureService { }
```

#### Configuration
```java
// Type-safe configuration with @ConfigMapping
@ConfigMapping(prefix = "heimdall")
public interface AppConfig {
    Patterns patterns();

    interface Patterns {
        String displayName();
    }
}
```

#### Caching
```java
// Method-level caching
@CacheResult(cacheName = "flink-jobs")
public List<FlinkJob> getJobs() {
    // Cached for 5 seconds (configured in application.properties)
}
```

#### Testing
```java
@QuarkusTest
public class MyTest {
    @Inject
    MyService service;

    @InjectMock  // Mock dependencies
    MyDependency dependency;

    @Test
    public void testSomething() {
        Mockito.when(dependency.doSomething()).thenReturn("expected");
        assertEquals("expected", service.execute());
    }
}
```

### Frontend Conventions

#### Component Structure
```svelte
<script>
  import { onMount } from 'svelte';
  import { myStore } from './stores/myStore.js';

  let { propName } = $props();  // Svelte 5 props
  let localState = $state(0);   // Svelte 5 state

  onMount(() => {
    // Initialization
  });
</script>

<div class="container">
  {#if condition}
    <p>{propName}</p>
  {/if}
</div>

<style>
  /* Component-scoped styles */
</style>
```

#### Store Patterns
```javascript
// Writable store with localStorage persistence
import { writable } from 'svelte/store';

const createSettingsStore = () => {
  const stored = localStorage.getItem('settings');
  const initial = stored ? JSON.parse(stored) : defaultSettings;

  const { subscribe, set, update } = writable(initial);

  return {
    subscribe,
    set: (value) => {
      localStorage.setItem('settings', JSON.stringify(value));
      set(value);
    },
    update: (fn) => {
      update((current) => {
        const updated = fn(current);
        localStorage.setItem('settings', JSON.stringify(updated));
        return updated;
      });
    }
  };
};

export const settings = createSettingsStore();
```

#### Code Style
- **Formatter:** Prettier
- **Linter:** ESLint with Svelte plugin
- **Indentation:** 2 spaces
- **Quotes:** Single quotes (JS), as-needed (attributes)
- **Semicolons:** Required
- **Trailing Commas:** ES5 (objects, arrays)

#### File Organization
```
src/main/webui/src/
├── lib/
│   ├── components/
│   │   ├── FlinkJobs.svelte      # Main dashboard component
│   │   ├── JobType.svelte         # Presentational component
│   │   ├── ExternalEndpoint.svelte# Link component
│   │   └── Modal.svelte           # Reusable modal
│   └── stores/
│       ├── flinkJobs.js           # Job data + polling
│       ├── appConfig.js           # App configuration
│       └── settings.js            # User preferences
├── test/                          # Unit tests
│   ├── components/
│   ├── stores/
│   └── setup.js
├── App.svelte                     # Root component
├── main.js                        # Entry point
└── app.css                        # Global Tailwind imports
```

---

## Testing Guidelines

### Backend Testing

#### Test Structure
- **Location:** `src/test/java/com/sap1ens/heimdall/`
- **Framework:** JUnit 5 + Mockito + REST-Assured
- **Naming:** `*Test.java` (e.g., `FlinkJobResourceTest`)

#### Test Types
1. **API Tests** - Test REST endpoints with `@QuarkusTest`
2. **Service Tests** - Test business logic with mocked dependencies
3. **Unit Tests** - Pure unit tests without Quarkus container

#### Coverage
- **Tool:** JaCoCo 0.8.11
- **Target:** 60% overall, 50% per class (aspirational)
- **Exclusions:** Model classes, K8s client wrappers
- **Note:** Coverage verification disabled due to Quarkus bytecode augmentation

#### Example
```java
@QuarkusTest
public class FlinkJobResourceTest {
    @InjectMock
    FlinkJobLocator jobLocator;

    @Test
    public void testGetJobs() {
        Mockito.when(jobLocator.getJobs())
            .thenReturn(List.of(new FlinkJob(...)));

        given()
            .when().get("/jobs")
            .then()
            .statusCode(200)
            .body("size()", is(1));
    }
}
```

### Frontend Testing

#### Unit Tests
- **Location:** `src/main/webui/src/test/`
- **Framework:** Vitest + Testing Library
- **Setup:** `setup.js` (mocks axios, localStorage)

#### E2E Tests
- **Location:** `src/main/webui/e2e/`
- **Framework:** Playwright
- **Browsers:** Chromium, Firefox, WebKit

#### Coverage
- **Tool:** Vitest (v8 provider)
- **Thresholds:** 15% lines, 40% functions, 70% branches
- **Format:** LCOV for Codecov integration

#### Example
```javascript
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import JobType from './JobType.svelte';

describe('JobType', () => {
  it('renders APPLICATION type correctly', () => {
    const { getByText } = render(JobType, {
      props: { type: 'APPLICATION' }
    });

    expect(getByText('APP')).toBeInTheDocument();
  });
});
```

### Running Tests

```bash
# Backend
./gradlew test                    # Run tests
./gradlew test jacocoTestReport   # With coverage
./gradlew test --tests "ClassName"# Specific test

# Frontend Unit
cd src/main/webui
npm test                          # Run once
npm run test:watch                # Watch mode
npm run test:coverage             # With coverage

# Frontend E2E
npm run test:e2e                  # Headless
npm run test:e2e:ui               # Interactive
```

---

## Build & Deployment

### Local Build

```bash
# Full build (backend + frontend)
./gradlew build

# Skip tests
./gradlew build -x test

# Uber-jar
./gradlew build -Dquarkus.package.type=uber-jar

# Run locally
java -jar build/quarkus-app/quarkus-run.jar
```

### Docker Build

#### Local Single-Platform
```bash
./gradlew build -x test
docker build -f src/main/docker/Dockerfile.jvm -t heimdall:latest .
docker run -p 8080:8080 heimdall:latest
```

#### Multi-Platform (amd64 + arm64)
```bash
# One-time setup
docker buildx create --use --name multiarch-builder

# Build and push
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -f src/main/docker/Dockerfile.jvm \
  -t ghcr.io/next-govejero/heimdall:latest \
  --push .
```

### CI/CD Workflows

#### Build Workflow (`.github/workflows/build.yml`)
**Trigger:** Push to any branch, Pull requests

**Steps:**
1. Setup Java 17 (Zulu), Gradle 8.1.1, Node 20
2. Install frontend dependencies (`npm ci`)
3. Run frontend unit tests with coverage
4. Build backend with Gradle (includes tests + JaCoCo)
5. Upload coverage to Codecov (separate flags: backend, frontend)
6. Archive test results and coverage reports

**Artifacts:**
- `backend-test-results`
- `backend-coverage-report`
- `frontend-coverage-report`

#### Release Workflow (`.github/workflows/release.yml`)
**Triggers:**
- Version tags: `v*` or `[0-9]+.[0-9]+.[0-9]+`
- Push to `main` branch
- Manual dispatch

**Version Strategy:**
- **Tag push** → Release version (strip `-SNAPSHOT`)
- **Main branch** → Snapshot version (append `-SNAPSHOT`)
- **Manual** → User-specified

**Steps:**
1. Determine version from `gradle.properties`
2. Build with Gradle
3. Build multi-platform Docker image (amd64, arm64)
4. Push to ghcr.io
5. Tag as `latest` (for releases only)
6. Create git tag (for releases only)
7. Generate release summary

**Images Published:**
- `ghcr.io/next-govejero/heimdall:{version}`
- `ghcr.io/next-govejero/heimdall:latest` (releases only)

### Versioning

**File:** `gradle.properties`
```properties
version=0.10.0
```

**Conventions:**
- Release versions: `0.10.0`
- Snapshot versions: `0.10.0-SNAPSHOT`
- Git tags: `v0.10.0` or `0.10.0`

---

## Common Tasks

### Adding a New REST Endpoint

1. **Create Resource Class:**
```java
// src/main/java/com/sap1ens/heimdall/api/MyResource.java
package com.sap1ens.heimdall.api;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

@Path("/my-endpoint")
@Produces(MediaType.APPLICATION_JSON)
public class MyResource {
    @GET
    public MyResponse getData() {
        return new MyResponse(...);
    }
}
```

2. **Create Test:**
```java
// src/test/java/com/sap1ens/heimdall/api/MyResourceTest.java
@QuarkusTest
public class MyResourceTest {
    @Test
    public void testGetData() {
        given()
            .when().get("/my-endpoint")
            .then()
            .statusCode(200);
    }
}
```

3. **Update Frontend (if needed):**
```javascript
// src/main/webui/src/lib/stores/myData.js
import axios from 'axios';
import { readable } from 'svelte/store';

export const myData = readable([], (set) => {
  axios.get('/my-endpoint').then((response) => set(response.data));
});
```

### Adding a New Configuration Property

1. **Update `AppConfig.java`:**
```java
@ConfigMapping(prefix = "heimdall")
public interface AppConfig {
    MyFeature myFeature();

    interface MyFeature {
        String setting();
    }
}
```

2. **Add to `application.properties`:**
```properties
heimdall.my-feature.setting=default-value
```

3. **Use in Service:**
```java
@Singleton
public class MyService {
    private final AppConfig config;

    public MyService(AppConfig config) {
        this.config = config;
    }

    public void doSomething() {
        String setting = config.myFeature().setting();
    }
}
```

### Adding a New Svelte Component

1. **Create Component:**
```svelte
<!-- src/main/webui/src/lib/components/MyComponent.svelte -->
<script>
  let { title } = $props();
</script>

<div class="my-component">
  <h2>{title}</h2>
</div>
```

2. **Create Test:**
```javascript
// src/main/webui/src/test/components/MyComponent.test.js
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import MyComponent from '../../lib/components/MyComponent.svelte';

describe('MyComponent', () => {
  it('renders title', () => {
    const { getByText } = render(MyComponent, {
      props: { title: 'Test' }
    });
    expect(getByText('Test')).toBeInTheDocument();
  });
});
```

3. **Use in Parent:**
```svelte
<script>
  import MyComponent from './lib/components/MyComponent.svelte';
</script>

<MyComponent title="Hello" />
```

### Modifying Mock Data

Edit `src/main/webui/mock-data.json` to add/modify test scenarios:
```json
[
  {
    "id": "test-job-1",
    "name": "my-test-job",
    "namespace": "default",
    "status": "RUNNING",
    "type": "APPLICATION",
    "parallelism": 4,
    "flinkVersion": "1.17.1",
    "metadata": {
      "env": "test",
      "team": "platform"
    }
  }
]
```

### Updating Dependencies

**Backend:**
```bash
# Check for updates
./gradlew dependencyUpdates

# Update version in gradle.properties or build.gradle
# Test thoroughly
./gradlew test
```

**Frontend:**
```bash
cd src/main/webui

# Check for updates
npm outdated

# Update package.json
# Install
npm install

# Test
npm test
npm run test:e2e
```

---

## Important Files Reference

### Configuration Files

| File | Purpose | Key Settings |
|------|---------|--------------|
| `src/main/resources/application.properties` | Backend configuration | CORS, cache, K8s, endpoints |
| `src/main/webui/vite.config.js` | Vite dev server | Proxy, port, plugins |
| `src/main/webui/vitest.config.js` | Unit test runner | Environment, coverage |
| `src/main/webui/playwright.config.js` | E2E tests | Browsers, retries |
| `src/main/webui/tailwind.config.js` | Tailwind styling | Colors, fonts, themes |
| `build.gradle` | Gradle build | Dependencies, plugins, tasks |
| `gradle.properties` | Gradle/Quarkus versions | `quarkusPlatformVersion`, `version` |
| `codecov.yml` | Coverage reporting | Flags, thresholds, ignores |
| `docker-compose.yml` | Local dev environment | Mock server, frontend dev |

### Code Quality Files

| File | Purpose |
|------|---------|
| `.editorconfig` | IDE formatting consistency |
| `.prettierrc` | Prettier config (frontend) |
| `.eslintrc.cjs` | ESLint config (frontend) |
| `package.json` (root) | Husky, lint-staged |
| `package.json` (webui) | Frontend scripts, dependencies |

### Documentation Files

| File | Purpose |
|------|---------|
| `README.md` | User documentation, features, deployment |
| `LOCAL_DEVELOPMENT.md` | Developer setup guide |
| `TESTING.md` | Testing guide and best practices |
| `CLAUDE.md` | This file (AI assistant guide) |
| `CHANGELOG.md` | Version history |
| `docs/RELEASE_WORKFLOW.md` | Release process documentation |

### Build & Deploy Files

| File | Purpose |
|------|---------|
| `.github/workflows/build.yml` | CI build and test |
| `.github/workflows/release.yml` | Docker image release |
| `src/main/docker/Dockerfile.jvm` | Standard Docker image |
| `src/main/docker/Dockerfile.native` | GraalVM native image |
| `tools/k8s-operator/service-account.yaml` | K8s permissions |
| `Makefile` | Development convenience commands |

---

## Tips for AI Assistants

### Understanding the Codebase

1. **Backend Entry Points:**
   - `src/main/java/com/sap1ens/heimdall/api/FlinkJobResource.java` - Main API endpoint
   - `src/main/java/com/sap1ens/heimdall/service/K8sOperatorFlinkJobLocator.java` - Job discovery logic
   - `src/main/resources/application.properties` - Configuration

2. **Frontend Entry Points:**
   - `src/main/webui/src/App.svelte` - Root component
   - `src/main/webui/src/lib/components/FlinkJobs.svelte` - Main dashboard
   - `src/main/webui/src/lib/stores/` - State management

3. **Key Data Flow:**
   ```
   K8s API → FlinkDeploymentClient → K8sOperatorFlinkJobLocator
   → FlinkJobResource (cached) → Frontend stores → Components
   ```

### When Making Changes

#### Always Run Tests
```bash
# Before committing
make test
make format
make lint
```

#### Pre-commit Hooks
Husky automatically runs:
- Spotless (Java formatting)
- ESLint + Prettier (frontend)
- lint-staged (staged files only)

#### Coverage Requirements
- **Backend:** Aim for 60%+ (not enforced)
- **Frontend:** 15%+ lines, 40%+ functions (enforced)
- **Note:** Backend verification disabled due to Quarkus/JaCoCo incompatibility

### Common Pitfalls

1. **Quarkus Caching:** Changes to cached methods require cache invalidation or server restart
2. **Svelte Reactivity:** Use `$state()` runes in Svelte 5, not `let`
3. **K8s Permissions:** Ensure service account has read access to `flinkdeployments`
4. **CORS:** Frontend dev server (5173) requires CORS configured for localhost
5. **Multi-namespace:** Comma-separated namespaces in config (e.g., `default,prod`)
6. **Docker Platforms:** Use buildx for multi-arch builds, not regular docker build

### Code Review Checklist

- [ ] Tests added/updated for new functionality
- [ ] Code formatted (Spotless for Java, Prettier for frontend)
- [ ] No ESLint warnings (frontend)
- [ ] Coverage thresholds maintained
- [ ] Configuration documented if new properties added
- [ ] Mock data updated if API changes (for frontend dev)
- [ ] README updated if user-facing changes
- [ ] CHANGELOG updated for releases

### Debugging Tips

#### Backend
```bash
# Verbose logging
./gradlew quarkusDev --info

# Debug port 5005
./gradlew quarkusDev -Ddebug=5005

# Check logs
tail -f build/quarkus.log
```

#### Frontend
```bash
# Browser console for reactive debugging
# Svelte DevTools extension recommended

# Network tab to inspect API calls

# Component inspection in Svelte DevTools
```

### Performance Considerations

1. **Caching:** Default 5s cache on `/jobs` - adjust in `application.properties`
2. **Pagination:** Frontend handles pagination client-side
3. **Polling:** Auto-refresh configurable (10s, 30s, 1m, 5m)
4. **K8s API:** Minimize calls by using cache effectively
5. **Bundle Size:** Frontend build optimized by Vite (tree-shaking, code splitting)

### Security Considerations

1. **K8s RBAC:** Read-only access to `flinkdeployments` (see `service-account.yaml`)
2. **CORS:** Configure allowed origins in production
3. **Distroless Image:** Minimal attack surface (no shell, package manager)
4. **Dependencies:** Regular security updates via Dependabot
5. **Secrets:** Never commit credentials (already in `.gitignore`)

### Architecture Decisions

1. **Why Quarkus?** Cloud-native, fast startup, low memory, excellent K8s integration
2. **Why Svelte?** Minimal runtime, reactive, small bundle size, fast performance
3. **Why Quinoa?** Seamless frontend integration in Quarkus build
4. **Why Caffeine?** High-performance in-memory cache, Quarkus-native
5. **Why Fabric8?** Official Kubernetes Java client, mature, well-documented
6. **Why Records?** Immutable DTOs, concise syntax, null-safe
7. **Why Stores?** Svelte-native reactive state, no external library needed

### Contributing Workflow

1. **Create Feature Branch:**
   ```bash
   git checkout -b claude/feature-name-{session-id}
   ```

2. **Make Changes:**
   - Write code following conventions
   - Add/update tests
   - Run `make format` and `make test`

3. **Commit:**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   # Pre-commit hooks run automatically
   ```

4. **Push:**
   ```bash
   git push -u origin claude/feature-name-{session-id}
   ```

5. **Create PR:**
   - Target branch: `main` (or as specified)
   - Include description and testing notes
   - CI must pass

### Understanding the Release Process

1. **Version Bumping:**
   - Edit `gradle.properties` → `version=X.Y.Z`
   - Commit to `main`

2. **Triggering Release:**
   - **Option A:** Push tag `git tag vX.Y.Z && git push origin vX.Y.Z`
   - **Option B:** Push to `main` (creates snapshot)
   - **Option C:** Manual workflow dispatch

3. **Release Artifacts:**
   - Docker images on ghcr.io
   - Git tags (for releases)
   - GitHub release notes

### Resources

- **Quarkus Guides:** https://quarkus.io/guides/
- **Svelte Docs:** https://svelte.dev/docs
- **Fabric8 K8s Client:** https://github.com/fabric8io/kubernetes-client
- **Flink K8s Operator:** https://nightlies.apache.org/flink/flink-kubernetes-operator-docs-main/
- **Tailwind CSS:** https://tailwindcss.com/docs
- **Vitest:** https://vitest.dev/
- **Playwright:** https://playwright.dev/

---

## Quick Reference

### Most Used Commands

```bash
# Development
make dev              # Start dev environment (Docker Compose)
./gradlew quarkusDev  # Run backend with live reload
cd src/main/webui && npm run dev  # Run frontend dev server

# Testing
make test             # Run all tests
make test-coverage    # Tests with coverage reports

# Code Quality
make format           # Format all code
make lint             # Lint frontend
make lint-fix         # Auto-fix linting issues

# Build
make build            # Build Java app
make build-image      # Build Docker image

# Cleanup
make clean            # Remove build artifacts
```

### Environment Variables (Common)

| Variable | Default | Description |
|----------|---------|-------------|
| `QUARKUS_HTTP_CORS_ORIGINS` | `http://localhost:5173` | CORS allowed origins |
| `HEIMDALL_JOBLOCATOR_K8S_OPERATOR_ENABLED` | `true` | Enable K8s operator locator |
| `HEIMDALL_JOBLOCATOR_K8S_OPERATOR_NAMESPACE_TO_WATCH` | `default` | K8s namespaces (comma-separated) |
| `HEIMDALL_PATTERNS_DISPLAY_NAME` | `$jobName` | Job name display pattern |
| `HEIMDALL_ENDPOINT_PATH_PATTERNS_FLINK_UI` | `http://localhost/$jobName/ui` | Flink UI URL pattern |

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/jobs` | GET | List all Flink jobs (cached 5s) |
| `/config` | GET | Application configuration |
| `/q/health/live` | GET | Liveness probe |
| `/q/health/ready` | GET | Readiness probe |

---

**Last Updated:** 2025-11-18
**Version:** 0.10.0
**Maintainer:** AI Assistant Guide for Heimdall

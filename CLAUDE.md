# CLAUDE.md — Android.Claw.Messeger

This file provides guidance for AI assistants (Claude and others) working in this repository. It documents codebase structure, development workflows, build commands, and conventions to follow when making changes.

---

## Project Overview

**Android.Claw.Messeger** is an Android messaging application. It is currently in the initial scaffolding phase — only a README exists. Development should follow the conventions, architecture, and tooling described in this document.

- **Platform:** Android (API 24+, targeting API 34+)
- **Language:** Kotlin (primary), Java interop permitted where necessary
- **Build System:** Gradle (Kotlin DSL preferred: `build.gradle.kts`)
- **Architecture:** MVVM + Clean Architecture with Repository pattern
- **Minimum SDK:** 24 (Android 7.0)
- **Target SDK:** 34 (Android 14)

---

## Repository Structure

When fully scaffolded, the project should follow this layout:

```
Android.Claw.Messeger/
├── app/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/claw/messenger/
│   │   │   │   ├── data/           # Data layer: repositories, data sources, models
│   │   │   │   │   ├── local/      # Room database, DAOs, local entities
│   │   │   │   │   ├── remote/     # Retrofit services, remote DTOs
│   │   │   │   │   └── repository/ # Repository implementations
│   │   │   │   ├── domain/         # Business logic layer
│   │   │   │   │   ├── model/      # Domain models (clean, no Android deps)
│   │   │   │   │   ├── repository/ # Repository interfaces
│   │   │   │   │   └── usecase/    # Use cases / interactors
│   │   │   │   ├── presentation/   # UI layer
│   │   │   │   │   ├── ui/         # Fragments, Activities, Composables
│   │   │   │   │   └── viewmodel/  # ViewModels
│   │   │   │   ├── di/             # Dependency injection modules (Hilt)
│   │   │   │   └── util/           # Shared utilities and extensions
│   │   │   ├── res/                # Resources (layouts, strings, drawables, etc.)
│   │   │   └── AndroidManifest.xml
│   │   ├── test/                   # JUnit unit tests
│   │   └── androidTest/            # Espresso instrumented tests
│   └── build.gradle.kts
├── buildSrc/ or gradle/libs.versions.toml  # Version catalog
├── .github/
│   └── workflows/                  # CI/CD (GitHub Actions)
├── gradle/
│   └── wrapper/
├── build.gradle.kts                # Root build file
├── settings.gradle.kts
├── gradle.properties
├── .gitignore
├── README.md
└── CLAUDE.md                       # This file
```

---

## Architecture

The project follows **MVVM + Clean Architecture** with three distinct layers:

### 1. Data Layer (`data/`)
- Implements repository interfaces from the domain layer
- Contains Room database entities and DAOs for local persistence
- Contains Retrofit API service interfaces for network calls
- Handles data mapping between remote/local models and domain models

### 2. Domain Layer (`domain/`)
- Pure Kotlin; no Android framework dependencies
- Defines repository interfaces (contracts)
- Contains use cases — each use case is a single-responsibility class with an `invoke` operator
- Contains domain models used throughout the app

### 3. Presentation Layer (`presentation/`)
- ViewModels expose `StateFlow` / `LiveData` to the UI
- UI built with **Jetpack Compose** (preferred) or XML layouts
- Fragments/Activities are thin — delegate all logic to ViewModels
- Navigation handled via **Jetpack Navigation Component**

### Dependency Injection
Use **Hilt** for dependency injection throughout the app.

---

## Key Libraries and Dependencies

| Category              | Library                                      |
|-----------------------|----------------------------------------------|
| DI                    | Hilt (`com.google.dagger:hilt-android`)      |
| Async / Coroutines    | Kotlin Coroutines + Flow                     |
| Networking            | Retrofit 2 + OkHttp 4                        |
| JSON                  | Moshi or Gson (choose one, document it)      |
| Local DB              | Room                                         |
| UI                    | Jetpack Compose + Material3                  |
| Navigation            | Jetpack Navigation Component                 |
| Image Loading         | Coil                                         |
| Real-time Messaging   | WebSockets (OkHttp WS) or Firebase           |
| Testing               | JUnit 4/5, MockK, Turbine, Espresso          |
| Logging               | Timber                                       |
| Static Analysis       | Detekt, ktlint                               |

---

## Build Commands

All commands are run from the project root directory.

```bash
# Build debug APK
./gradlew assembleDebug

# Build release APK
./gradlew assembleRelease

# Run all unit tests
./gradlew test

# Run instrumented tests (requires connected device/emulator)
./gradlew connectedAndroidTest

# Run a specific test class
./gradlew testDebugUnitTest --tests "com.claw.messenger.ExampleTest"

# Run static analysis (Detekt)
./gradlew detekt

# Run ktlint check
./gradlew ktlintCheck

# Auto-fix ktlint violations
./gradlew ktlintFormat

# Full check (lint + tests)
./gradlew check

# Clean build
./gradlew clean

# Install debug build on connected device
./gradlew installDebug

# Generate lint report
./gradlew lint
```

---

## Development Workflow

### Branching Strategy
- `main` — stable, production-ready code
- `develop` — integration branch for features
- `feature/<short-description>` — individual feature branches
- `fix/<short-description>` — bug fix branches
- `claude/<task-id>` — branches created by AI assistants

Always branch off `develop` (or `main` if `develop` does not exist yet) and open a pull request targeting `develop`.

### Commit Message Convention
Follow **Conventional Commits**:

```
<type>(<scope>): <short summary>

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `chore`, `refactor`, `test`, `docs`, `style`, `perf`, `ci`

Examples:
```
feat(chat): add real-time message delivery status
fix(auth): handle expired JWT token refresh correctly
test(repository): add unit tests for MessageRepository
docs: update CLAUDE.md with build instructions
```

### Pull Request Process
1. Ensure all tests pass: `./gradlew check`
2. No lint errors or detekt violations
3. Write/update unit tests for changed logic
4. Keep PRs focused — one feature or fix per PR
5. Add a clear description of what was changed and why

---

## Code Conventions

### Kotlin Style
- Follow [Kotlin Coding Conventions](https://kotlinlang.org/docs/coding-conventions.html)
- 4-space indentation (no tabs)
- Max line length: 120 characters
- Prefer `val` over `var`; use immutable data where possible
- Use `data class` for models
- Prefer expression bodies for simple functions
- Use named arguments for clarity when calling functions with multiple parameters

### Android-Specific
- Use `viewModelScope` for coroutines in ViewModels
- Collect flows in the UI using `repeatOnLifecycle(Lifecycle.State.STARTED)`
- Never do work on the main thread: use `Dispatchers.IO` for I/O, `Dispatchers.Default` for CPU-intensive work
- Avoid storing `Context` references in ViewModels; use `ApplicationContext` via Hilt if needed
- Resource IDs: use descriptive names with prefix conventions:
  - Layouts: `fragment_chat.xml`, `item_message.xml`
  - Strings: `str_send_button`, `str_error_network`
  - Drawables: `ic_send.xml`, `bg_message_bubble.xml`

### Package Naming
- Base package: `com.claw.messenger`
- Sub-packages follow the feature-first approach for larger feature modules:
  `com.claw.messenger.feature.chat`, `com.claw.messenger.feature.auth`

### Error Handling
- Use sealed classes or `Result<T>` wrappers for operation outcomes
- Do not swallow exceptions silently; log with Timber and propagate meaningful errors to the UI
- Display user-facing errors via SnackBar or dialogs, never raw exception messages

### Null Safety
- Avoid `!!` (non-null assertion) — use safe calls (`?.`), `let`, `elvis` operator, or proper null checks
- Mark nullable fields explicitly; prefer non-null where the domain guarantees it

---

## Testing Conventions

### Unit Tests (`app/src/test/`)
- Test every ViewModel, use case, and repository method
- Use **MockK** for mocking
- Use **Turbine** for testing Kotlin Flows
- Test file naming: `<ClassUnderTest>Test.kt`
- Each test method name: `given_<state>_when_<action>_then_<expectation>`

Example:
```kotlin
@Test
fun given_validCredentials_when_loginCalled_then_emitsSuccessState() = runTest {
    // Arrange
    every { mockAuthRepo.login(any(), any()) } returns flowOf(Result.Success(mockUser))
    // Act
    viewModel.login("user@example.com", "password")
    // Assert
    assertEquals(AuthState.Success(mockUser), viewModel.uiState.value)
}
```

### Instrumented Tests (`app/src/androidTest/`)
- Use Espresso for UI tests
- Use Hilt testing APIs to inject test dependencies
- Test critical user flows: login, send message, receive message

---

## Sensitive Information and Security

- **Never commit API keys, secrets, or credentials** to the repository
- Store secrets in `local.properties` (gitignored) or environment variables
- Use Android Keystore for sensitive runtime data
- Validate and sanitize all user input before sending to network or database
- Use HTTPS for all network communication; enforce certificate pinning for production

---

## CI/CD (GitHub Actions — intended setup)

Workflows should be created under `.github/workflows/`:

- `ci.yml` — Runs on every PR: lint, unit tests, build debug APK
- `release.yml` — Runs on push to `main`: build signed release APK, publish

---

## Known Issues / TODOs

- [ ] Android project scaffold not yet created (Gradle files, source directories)
- [ ] Dependencies not yet declared
- [ ] CI/CD pipeline not yet configured
- [ ] No source code exists yet — all architecture above is the intended target state

---

## Getting Started (for new contributors)

1. Clone the repository
2. Open in Android Studio (Hedgehog or newer recommended)
3. Sync Gradle dependencies
4. Ensure an emulator or physical device is connected
5. Run `./gradlew assembleDebug` to verify the build
6. Run `./gradlew test` to verify tests pass

---

*Last updated: 2026-02-23*

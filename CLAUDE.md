# Snomio - Claude Code Instructions

## Tech Stack

- **Backend:** Java 17+, Spring Boot, Maven multi-module (`pom.xml` at root, modules: `auth`, `common`, `api`, `eclrefset`)
- **Frontend:** TypeScript, React, MUI (Material UI), Vite, in `ui/` directory
- **CI/CD:** Azure DevOps Pipelines (`azure-pipelines.yml`)
- **Testing:** JUnit + WireMock + Testcontainers (backend), Vitest unit tests + Cypress e2e (frontend)
- **Code style:** Google Java Style Guide (enforced by `com.spotify.fmt:fmt-maven-plugin`); UI follows Prettier + ESLint

## Maven module ordering gotcha

The `api` module depends on `common`. After modifying `common/src/...`, install it locally
before running tests in `api`, otherwise `api` will resolve the stale published jar:

```bash
mvn -pl common install -DskipTests -Dims-username=x -Dims-password=x
```

## `-Dims-username` / `-Dims-password` is required for Maven

The build's `maven-enforcer-plugin` requires `ims-username` and `ims-password` properties
or it fails with `RequireProperty failed`. For local builds where IMS isn't actually
exercised, any non-empty value is fine:

```bash
mvn compile -Dims-username=x -Dims-password=x
```

Apply the same flags to `mvn test`, `mvn install`, etc.

## Build Verification

After making changes, verify they compile **and** pass the formatters/linters that
the pre-commit hook runs. The pre-commit config (`.pre-commit-config.yaml`) runs
`com.spotify.fmt:fmt-maven-plugin` on staged Java, Prettier on staged UI assets,
and ESLint on staged `.ts`/`.tsx` — so a `git commit` will reject unformatted code.

```bash
# Backend (Java/Maven) — compile + format check
mvn compile -Dims-username=x -Dims-password=x
mvn -pl api com.spotify.fmt:fmt-maven-plugin:format   # auto-fix any formatting drift

# Frontend (TypeScript/React) — build + lint + prettier
cd ui && npm run build
cd ui && npm run lint        # eslint with --max-warnings=0; warnings fail the build
cd ui && npm run prettier    # check; use `npm run makeitpretty` to auto-fix
```

If a `mvn` invocation fails with `Found N non-complying files`, run the
`fmt-maven-plugin:format` goal above to auto-fix and re-run. Treat ESLint warnings
as errors — the project sets `--max-warnings=0` and the pre-commit hook enforces it.

## CHANGELOG

User-facing changes must add a bullet to the `## [Unreleased]` section in
`CHANGELOG.md` at the repo root. CI runs a `check-changelog` step that fails the
build if a PR with substantive changes leaves `[Unreleased]` empty. Format follows
Keep a Changelog (sections: Added, Changed, Fixed, Security, Deprecated, Removed)
but the `[Unreleased]` block is typically a flat bullet list with the issue/PR
number in parentheses.

## Spring profiles

Local runs pick a profile via `spring.profiles.active`. Available profiles in
`api/src/main/resources/`:

- `amtuat` — UAT against Australian Medicines Terminology
- `nmpcuat` — UAT against the Irish NMPC extension
- `dc4h` — Dev environment
- `h2` — In-memory H2 database (no external Snowstorm/Auth)

The `application-test.properties` file is for tests; do not commit local edits to it.

## Data class conventions

- **JPA entities** (anything Hibernate manages — `@Entity`, `@Audited`, etc.) use Lombok
  `@Data` / `@Builder` / `@NoArgsConstructor` / `@AllArgsConstructor`. Hibernate needs a no-arg
  constructor and setters, and the auditing/envers stack expects bean conventions.
- **Immutable response DTOs** (service → controller → JSON) use Java records. Records give
  immutability by language, a compact constructor for cross-field invariants, predictable
  `equals`/`hashCode`/`toString` from the JVM, and don't need an annotation processor. Use
  Lombok `@NonNull` on required record components and `jakarta.annotation.Nullable` on
  optional ones — `@NonNull` generates the runtime null check so the compact constructor only
  has to express invariants that can't be modelled by per-field annotations.

## Framework-Specific Notes

### Spring Boot (Backend)
- `@Async` does not work in unit tests without a Spring context. Do not delete tests
  that fail for this reason — instead mock or use `@SpringBootTest`.
- Be aware of Hibernate lazy loading and serialization pitfalls.
- WebClient `ExchangeFilterFunction`s that read `SecurityContextHolder` (e.g.
  `AuthHelper.addImsAuthCookie`) only work on the request thread. Recursive
  `flatMap` over WebClient calls subscribes the next call from a netty event-loop
  thread where the ThreadLocal is empty, causing NPE on the IMS cookie. For
  paginated walks use a synchronous `while` loop with per-page `.block()` instead
  of recursive reactive chaining.

### React/MUI (Frontend)
- Respect existing ESLint configuration. Check if rules are disabled before reporting findings.
- MUI theme augmentation requires module declaration in a `.d.ts` file — do not add
  properties to the theme without updating the type declarations.
- When sorting arrays from props or state, always spread/copy first to avoid mutating
  read-only arrays.

## Code Editing Rules

- When editing TypeScript, run `npx tsc --noEmit` after changes to catch type errors.
- When editing Java, run `mvn compile -Dims-username=x -Dims-password=x` after changes.
- After multi-file or non-trivial Java changes, also run the project's formatter:
  `mvn -pl api com.spotify.fmt:fmt-maven-plugin:format` — pre-commit will reject
  unformatted code at commit time anyway.
- After UI changes that touch `.ts`/`.tsx`, run `cd ui && npm run lint` — pre-commit
  will fail otherwise (`--max-warnings=0`).

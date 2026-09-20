# Freshness and maintenance

## Evidence boundaries

A timestamp means the Homebrew JSON API was checked then. It is not the vendor release date, a security review, a download test or clean-machine verification. Homebrew can lag upstream. Keep vendor claims and package metadata separate.

Initial release: catalog metadata verified; install wrapper tested using mocked commands. No clean-Mac full install, Intel coverage or physical-device matrix is claimed.

## Maintainer commands

Node.js 22+ is needed only for repository maintenance and tests. There are no npm dependencies to install.

```bash
npm run check       # offline schema/generated-file check
npm test            # mocked installer tests; no installs
npm run audit       # live read-only API check; reports/ output
npm run refresh     # fetch all metadata, preserve old snapshot if fetch fails
npm run generate    # regenerate Brewfiles/docs from curated data
```

Review version, homepage and compatibility changes after refresh. Compatibility notes are human-maintained and must be reconciled, not blindly copied forward. Commit the updated snapshot and generated files together. A successful refresh requires every package to respond with a valid, usable record.

## Scheduled workflow

Weekly on Monday at 08:17 UTC, plus manual dispatch and relevant pushes. A version or compatibility change produces a failing freshness status (review needed), a downloadable report and one issue titled **Catalog freshness review**. The workflow updates that issue instead of creating duplicates. An HTTP failure means verification is incomplete, not that an app has vanished. Last valid committed data remains intact.

Issue text includes a machine-readable marker so the workflow only updates its own issue. Updating the catalog is a deliberate maintainer action. After refreshing and reviewing, rerun the workflow and close the resolved issue. Forks must enable Actions and may need to adjust repository links. GitHub schedules can be delayed or disabled after inactivity.

## Safe release checklist

1. Validate all catalog entries and sources.
2. Review compatibility notes and commercial/account caveats.
3. Run syntax checks and mocked tests on macOS and Linux.
4. Inspect live freshness report; preserve errors and last valid results honestly.
5. If clean-machine tests were run, record OS, architecture, date, selected profiles and outcomes, without credentials or identifying machine details.
6. Never label the whole repo 'tested on macOS' based only on dry-run/mock CI.

# Freshness and maintenance

## Evidence boundaries

A timestamp means the Homebrew JSON API was checked then. It is not the vendor release date, a security review, a download test, an upstream-license revalidation or clean-machine verification. Homebrew can lag upstream. Keep vendor claims and package metadata separate.

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

Review version, homepage, compatibility and formula-license changes after refresh. Open-source classification and cask-license evidence require human review. A formula-license change must be reviewed in catalog/apps.json before refresh can accept it. Compatibility notes are human-maintained and must be reconciled, not blindly copied forward. Commit the updated snapshot and generated files together. A successful refresh requires every package to respond with a valid, usable record.

## Scheduled workflow

Weekly on Monday at 08:17 UTC, plus manual dispatch and relevant pushes. A version, compatibility, app-bundle-name or formula-license change produces a failing freshness status (review needed), a downloadable report and one issue titled **Catalog freshness review**. The workflow updates that issue instead of creating duplicates. An HTTP failure means verification is incomplete, not that an app has vanished. Last valid committed data remains intact.

Issue text includes a machine-readable marker so the workflow only updates its own issue. Updating the catalog is a deliberate maintainer action. After refreshing and reviewing, rerun the workflow and close the resolved issue. Forks must enable Actions and may need to adjust repository links. GitHub schedules can be delayed or disabled after inactivity.

## Safe release checklist

1. Validate all catalog entries and sources.
2. Review compatibility notes and commercial/account caveats.
3. Run syntax checks and mocked tests on macOS and Linux.
4. Inspect live freshness report; preserve errors and last valid results honestly.
5. If clean-machine tests were run, record OS, architecture, date, selected profiles and outcomes, without credentials or identifying machine details.
6. Never label the whole repo 'tested on macOS' based only on dry-run/mock CI.

## Open-source policy

Only the `optional` profile may contain entries not classified `open-source`. The catalog validator enforces this boundary and requires license evidence plus review timestamps. Formula-license metadata is checked automatically; cask/upstream licenses, optional services, trademarks and bundled dependency qualifications require human review. Free-of-charge and source-available are not synonyms for open source.

## Rerun verification

Stateful installer fixtures cover a partially configured Mac, a second apply, manually installed apps, invalid app folders, explicit upgrade checks and recovery from a partial failure. They must never invoke real Homebrew mutation commands. The committed app-bundle TSV is generated from Homebrew cask artifacts and validated alongside the Brewfiles. A supported cask needs one unambiguous safe `.app` basename. Changes to artifact names need a metadata refresh and human review. Do not claim app authenticity, app health or clean-Mac verification from these checks.

## Ansible controller maintenance

Review `ansible/requirements.txt` separately from the Homebrew metadata snapshot. The controller is optional for users, but required in hosted CI. Update its pin deliberately, run syntax checks and `npm run test:ansible` with that controller, and verify both macOS and Linux before publishing. Integration tests use real Ansible with mocked Homebrew, not real app installs. See [the Ansible guide](ansible.md) for preview/check-mode and change-reporting boundaries.

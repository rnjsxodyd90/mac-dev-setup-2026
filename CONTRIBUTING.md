# Contributing

Keep this project small, current and safe.

1. Explain the user problem and why an existing entry is insufficient.
2. Prefer official Homebrew formulae/casks; give an official vendor homepage.
3. Check macOS/architecture, licensing and account requirements.
4. Add entries to catalog/apps.json, not directly to generated Brewfiles.
5. For a new package, add a verified metadata record with source evidence to catalog/verified.json; never invent versions. Then run npm run refresh and review all changes. For an existing package, npm run refresh is sufficient.
6. Run npm run generate, npm run check and npm test.
7. Include what was actually tested. Distinguish API checks, mocked tests and real installations.

Do not add destructive defaults, credential collection, remote-script piping, unreviewed taps, affiliate links or unsupported claims such as 'always latest'. Do not copy another repository's code without following its license and preserving attribution.

Suggested tools belong in an appropriate profile. Overlapping editors, terminals and browsers should be clearly optional.

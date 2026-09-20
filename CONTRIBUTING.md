# Contributing

Keep this project useful, current and open-source first.

1. Explain the everyday need, who benefits and overlap with existing entries.
2. Prefer maintained open-source tools and official Homebrew formulae/casks. Include the upstream project and license evidence, not only a download link.
3. Distinguish the installed binary from its upstream source and optional commercial services. Do not equate free-of-charge, source-available and open source.
4. Put proprietary, mixed-license or unverified-open-source apps in `optional` only. Core profiles must contain entries classified `open-source` with reviewed license evidence.
5. Edit catalog/apps.json, not the generated Brewfiles. For a new package, run npm run refresh to validate all live Homebrew records before generating the new catalog. Cask-license evidence requires human review; Homebrew casks do not supply license metadata.
6. Run npm run generate, npm run check and npm test. Review generated lists and compatibility notes.
7. Describe actual tests. Separate metadata checks, mocked tests, license evidence and clean-Mac installation results.

Do not add destructive defaults, credential collection, remote-script piping, unreviewed taps, affiliate links or unsupported 'always latest' claims. Preserve attribution and licenses when reusing others' code. Never commit personal configuration or secrets.

Runtime/service starts, shell modifications, model downloads and paid accounts must remain explicit manual steps. Prefer small independent profiles over an install-everything option.

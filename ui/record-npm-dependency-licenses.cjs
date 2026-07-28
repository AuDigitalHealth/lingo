// record-npm-dependency-licenses.cjs
//
// Records the licences of the frontend's PRODUCTION npm dependencies (the code
// that is actually bundled into the distributed UI) into `dependency-licenses`,
// and regenerates the structured Markdown section (third-party-notices-npm.md)
// used by THIRD_PARTY_NOTICES.md.
//
// Uses `pnpm licenses list --prod` because pnpm's symlinked node_modules layout
// is not understood by license-checker's `production` filter (it would list all
// of node_modules, including test/build tooling such as cypress, vitest, eslint
// and vite that is never shipped). check-licenses.cjs still validates the full
// tree (including dev dependencies) against the allowlist.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

// Invoke pnpm via the current Node interpreter using `npm_execpath` (which pnpm
// sets when running a `pnpm run` script) rather than relying on a `pnpm`
// executable being resolvable on PATH. Under the frontend-maven-plugin's
// install-node-and-pnpm layout the `pnpm` on PATH is not a directly-executable
// binary, so `execFileSync('pnpm', …)` fails with EACCES in CI. Fall back to a
// bare `pnpm` (via a shell for PATH/wrapper resolution) when the script is run
// outside a `pnpm run` context.
const pnpmArgs = ['licenses', 'list', '--prod', '--json'];
const raw = process.env.npm_execpath
  ? execFileSync(process.execPath, [process.env.npm_execpath, ...pnpmArgs], {
      cwd: __dirname,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    })
  : execFileSync('pnpm', pnpmArgs, {
      cwd: __dirname,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      shell: true,
    });

const data = JSON.parse(raw);

// pnpm groups by licence: { "<licence>": [ { name, versions: [...], ... } ] }
const rows = [];
for (const [license, pkgs] of Object.entries(data)) {
  for (const pkg of pkgs) {
    for (const version of pkg.versions && pkg.versions.length
      ? pkg.versions
      : ['']) {
      rows.push({ license, name: pkg.name, version });
    }
  }
}
rows.sort(
  (a, b) => a.name.localeCompare(b.name) || a.version.localeCompare(b.version),
);

let formattedDependencies = '\n\n# NPM Dependencies and Licenses\n\n';
for (const r of rows) {
  formattedDependencies += `    (${r.license}) ${r.name}@${r.version}\n\n`;
}

fs.writeFileSync(
  path.join(__dirname, 'dependency-licenses'),
  formattedDependencies,
);
console.log(`Wrote dependency-licenses (${rows.length} production packages).`);

// Also (re)generate the structured Markdown npm section used by
// THIRD_PARTY_NOTICES.md, so the two stay in sync.
require('./format-third-party-notices-npm.cjs');

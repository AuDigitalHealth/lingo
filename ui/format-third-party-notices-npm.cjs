// format-third-party-notices-npm.cjs
//
// Transforms the flat `dependency-licenses` file (produced by
// record-npm-dependency-licenses.cjs) into a properly structured Markdown
// section for THIRD_PARTY_NOTICES.md: a licence-summary table plus a
// component list in the same bullet style used for the backend (Java)
// components. Derived from `dependency-licenses` so it stays consistent with
// that file and does not re-resolve node_modules.
//
// Output: third-party-notices-npm.md
// The Maven build (maven-antrun-plugin, root pom) appends this file to the
// generated THIRD_PARTY_NOTICES.md.

const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, 'dependency-licenses');
const outputPath = path.join(__dirname, 'third-party-notices-npm.md');

const lines = fs.readFileSync(inputPath, 'utf8').split('\n');

// Each component line looks like:  `    (<licence>) <name>@<version>`
// where <licence> may be an SPDX expression containing its own parentheses,
// so the separator is the last `) ` before the package coordinate.
const entryRe = /^\s+\((.*)\)\s+(\S+)\s*$/;

const components = [];
const counts = new Map();

for (const line of lines) {
  const m = line.match(entryRe);
  if (!m) continue;
  const licence = m[1].trim();
  const coord = m[2];
  const at = coord.lastIndexOf('@');
  const name = at > 0 ? coord.slice(0, at) : coord;
  const version = at > 0 ? coord.slice(at + 1) : '';
  components.push({ licence, name, version });
  counts.set(licence, (counts.get(licence) || 0) + 1);
}

const summaryRows = [...counts.keys()]
  .sort((a, b) => a.localeCompare(b))
  .map(lic => `| ${lic} | ${counts.get(lic)} |`)
  .join('\n');

const componentRows = components
  .map(
    c =>
      `- (${c.licence}) **${c.name}**${c.version ? ` (\`${c.version}\`)` : ''}`,
  )
  .join('\n');

const md = `## Licence summary - Frontend (npm)

The web UI is bundled from the ${components.length} npm packages below. All are
under permissive licences, enforced at build time by \`ui/check-licenses.cjs\`
against the allowlist in \`ui/allowed-licenses.json\`.

| Licence(s) | Components |
| ---------- | ---------: |
${summaryRows}

## Frontend (npm) components

${componentRows}
`;

fs.writeFileSync(outputPath, md);
console.log(
  `Wrote ${outputPath} (${components.length} npm components, ${counts.size} distinct licence expressions).`,
);

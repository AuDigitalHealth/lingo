// record-npm-dependency-licenses.cjs
const fs = require('fs');
const path = require('path');
const licenseChecker = require('license-checker');

const dependenciesFilePath = path.join(__dirname, 'npm-dependencies.json');
let formattedDependencies = '\n\n# NPM Dependencies and Licenses\n\n';

licenseChecker.init({ start: '.' }, function (err, packages) {
  if (err) {
    console.error(err);
    process.exit(1);
  } else {
    Object.keys(packages).forEach(pkg => {
      formattedDependencies += `    (${packages[pkg].licenses}) ${pkg}\n\n`;
    });

    fs.writeFileSync('dependency-licenses', formattedDependencies);
    console.log(
      'NPM dependencies and licenses have been appended to the LICENSE file.',
    );
  }
});

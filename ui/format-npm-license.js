const fs = require('fs');

const dependencies = JSON.parse(
  fs.readFileSync('npm-dependencies.json', 'utf8'),
);
let formattedDependencies = '\n\n# NPM Dependencies and Licenses\n\n';

Object.keys(dependencies).forEach(dep => {
  formattedDependencies += `## ${dep}\n`;
  formattedDependencies += `- Version: ${dependencies[dep].version}\n`;
  formattedDependencies += `- License: ${dependencies[dep].licenses}\n\n`;
});

fs.appendFileSync('LICENSE', formattedDependencies);

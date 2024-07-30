const licenseChecker = require('license-checker');
const allowedLicenses = require('./allowed-licenses.json');
const allowedPackages = require('./allowed-packages.json');

licenseChecker.init({ start: '.' }, function (err, packages) {
  if (err) {
    console.error(err);
    process.exit(1);
  } else {
    const invalidLicenses = [];
    for (const pkg in packages) {
      const license = packages[pkg].licenses;
      if (!allowedLicenses[license] && !allowedPackages[pkg]) {
        invalidLicenses.push(`${pkg}: ${license}`);
      }
    }
    if (invalidLicenses.length > 0) {
      console.error('Invalid licenses found:\n' + invalidLicenses.join('\n'));
      process.exit(1);
    } else {
      console.log('All licenses are valid.');
    }
  }
});

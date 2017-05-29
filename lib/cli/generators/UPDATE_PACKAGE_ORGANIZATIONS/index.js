const helpers = require('../../lib/helpers');
const latestVersion = require('latest-version');
const spawn = require('child-process-promise').spawn;
const path = require('path');

const packageNames = require('@storybook/codemod').packageNames;

function updatePackage(devDependencies, oldName, newName) {
  if (devDependencies[oldName]) {
    return latestVersion(newName).then(version => {
      delete devDependencies[oldName];
      devDependencies[newName] = version;
    });
  } else {
    return Promise.resolve(null);
  }
}

function updatePackageJson() {
  const packageJson = helpers.getPackageJson();
  const { devDependencies } = packageJson;

  return Promise.all(
    Object.keys(packageNames).map(oldName => {
      const newName = packageNames[oldName];
      return updatePackage(devDependencies, oldName, newName);
    })
  ).then(() => {
    if (!devDependencies['@storybook/react'] && !devDependencies['@storybook/react-native']) {
      throw new Error('Expected to find `@kadira/[react-native]-storybook` in devDependencies');
    }
    helpers.writePackageJson(packageJson);
  });
}

function updateSourceCode() {
  const jscodeshiftPath = path.dirname(require.resolve('jscodeshift'));
  const jscodeshiftCommand = path.join(jscodeshiftPath, 'bin', 'jscodeshift.sh');

  const codemodPath = path.join(
    path.dirname(require.resolve('@storybook/codemod')),
    'transforms',
    'update-organisation-name.js'
  );

  const args = ['-t', codemodPath, '--silent', '--ignore-pattern', '"node_modules|dist"', '.'];

  return spawn(jscodeshiftCommand, args, { stdio: 'inherit' });
}

module.exports = updatePackageJson().then(updateSourceCode);

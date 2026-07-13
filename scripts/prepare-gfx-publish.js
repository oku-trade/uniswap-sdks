#!/usr/bin/env node
/**
 * Prepares the oku-trade fork packages for publishing under the @gfxlabs scope.
 *
 * In-tree, packages keep their upstream names (@uniswap/*) so that bun
 * workspaces and future upstream merges keep working. At publish time this
 * script:
 *   1. renames @uniswap/sdk-core -> @gfxlabs/uniswap-sdk-core and
 *      @uniswap/universal-router-sdk -> @gfxlabs/uniswap-universal-router-sdk
 *   2. appends a prerelease suffix to their versions (default -0)
 *   3. points universal-router-sdk's @uniswap/sdk-core dependency at the
 *      @gfxlabs npm alias so consumers get the fork's chains
 *   4. resolves all remaining workspace:* deps to concrete versions
 *
 * Usage: node scripts/prepare-gfx-publish.js [suffix]
 *   e.g. node scripts/prepare-gfx-publish.js 3
 * Then:  npm publish --access public (in each renamed package dir)
 *
 * Do not commit the resulting package.json changes.
 */
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const rootDir = path.resolve(__dirname, '..')
const suffix = process.argv[2] ?? '0'

const RENAMES = {
  '@uniswap/sdk-core': '@gfxlabs/uniswap-sdk-core',
  '@uniswap/universal-router-sdk': '@gfxlabs/uniswap-universal-router-sdk',
}

const PACKAGE_DIRS = {
  '@uniswap/sdk-core': path.join(rootDir, 'sdks/sdk-core'),
  '@uniswap/universal-router-sdk': path.join(rootDir, 'sdks/universal-router-sdk'),
}

const gfxVersions = {}

for (const [name, dir] of Object.entries(PACKAGE_DIRS)) {
  const pkgPath = path.join(dir, 'package.json')
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
  pkg.name = RENAMES[name]
  pkg.version = `${pkg.version}-${suffix}`
  gfxVersions[name] = pkg.version
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
  console.log(`${name} -> ${pkg.name}@${pkg.version}`)
}

const urPkgPath = path.join(PACKAGE_DIRS['@uniswap/universal-router-sdk'], 'package.json')
const urPkg = JSON.parse(fs.readFileSync(urPkgPath, 'utf8'))
urPkg.dependencies['@uniswap/sdk-core'] = `npm:${RENAMES['@uniswap/sdk-core']}@${gfxVersions['@uniswap/sdk-core']}`
fs.writeFileSync(urPkgPath, JSON.stringify(urPkg, null, 2) + '\n')
console.log(`universal-router-sdk @uniswap/sdk-core dep -> ${urPkg.dependencies['@uniswap/sdk-core']}`)

execSync(`node ${path.join(rootDir, 'scripts/resolve-workspace-protocol.js')}`, { stdio: 'inherit' })

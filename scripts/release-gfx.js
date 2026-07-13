#!/usr/bin/env node
/**
 * One-shot release of the fork packages under the @gfxlabs scope.
 *
 * Builds the monorepo, renames @uniswap/sdk-core and
 * @uniswap/universal-router-sdk to their @gfxlabs names via
 * prepare-gfx-publish.js, publishes both to npm, and then restores every
 * package.json it touched - even if a step fails partway through.
 *
 * The prerelease suffix is auto-detected from the npm registry (next free
 * `-N` for the current base versions) unless one is passed explicitly.
 *
 * Usage:
 *   bun run release:gfx          # auto suffix
 *   bun run release:gfx 7        # explicit suffix
 *   bun run release:gfx --dry-run
 */
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const rootDir = path.resolve(__dirname, '..')
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const explicitSuffix = args.find((a) => /^\d+$/.test(a))

const GFX_NAMES = {
  'sdks/sdk-core': '@gfxlabs/uniswap-sdk-core',
  'sdks/universal-router-sdk': '@gfxlabs/uniswap-universal-router-sdk',
}
const PUBLISH_ORDER = ['sdks/sdk-core', 'sdks/universal-router-sdk']

const run = (cmd, opts = {}) => execSync(cmd, { stdio: 'inherit', cwd: rootDir, ...opts })

function workspacePackageJsonPaths() {
  const rootPkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'))
  const paths = []
  for (const pattern of rootPkg.workspaces || []) {
    const base = path.join(rootDir, pattern.replace('/*', ''))
    if (!fs.existsSync(base)) continue
    const dirs = pattern.includes('/*') ? fs.readdirSync(base).map((e) => path.join(base, e)) : [base]
    for (const dir of dirs) {
      const pkgPath = path.join(dir, 'package.json')
      if (fs.existsSync(pkgPath)) paths.push(pkgPath)
    }
  }
  return paths
}

function nextSuffix(gfxName, baseVersion) {
  let versions
  try {
    const out = execSync(`npm view ${gfxName} versions --json`, { stdio: ['ignore', 'pipe', 'pipe'] }).toString()
    versions = JSON.parse(out)
    if (typeof versions === 'string') versions = [versions]
  } catch {
    return 0
  }
  const taken = versions
    .map((v) => {
      const m = v.match(new RegExp(`^${baseVersion.replace(/\./g, '\\.')}-(\\d+)$`))
      return m ? Number(m[1]) : null
    })
    .filter((n) => n !== null)
  return taken.length ? Math.max(...taken) + 1 : 0
}

function resolveSuffix() {
  if (explicitSuffix !== undefined) return explicitSuffix
  let suffix = 0
  for (const [dir, gfxName] of Object.entries(GFX_NAMES)) {
    const base = JSON.parse(fs.readFileSync(path.join(rootDir, dir, 'package.json'), 'utf8')).version
    suffix = Math.max(suffix, nextSuffix(gfxName, base))
  }
  return String(suffix)
}

const snapshots = new Map()
for (const pkgPath of workspacePackageJsonPaths()) {
  snapshots.set(pkgPath, fs.readFileSync(pkgPath, 'utf8'))
}

const restore = () => {
  for (const [pkgPath, contents] of snapshots) {
    fs.writeFileSync(pkgPath, contents)
  }
  console.log('Restored package.json files')
}

try {
  console.log('Building workspace...')
  run('bun run g:build')

  const suffix = resolveSuffix()
  console.log(`Using version suffix -${suffix}`)
  run(`node scripts/prepare-gfx-publish.js ${suffix}`)

  for (const dir of PUBLISH_ORDER) {
    const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, dir, 'package.json'), 'utf8'))
    console.log(`Publishing ${pkg.name}@${pkg.version}...`)
    run(`npm publish --access public --tag latest --provenance=false${dryRun ? ' --dry-run' : ''}`, {
      cwd: path.join(rootDir, dir),
    })
  }

  console.log(dryRun ? 'Dry run complete' : 'Published successfully')
} finally {
  restore()
}

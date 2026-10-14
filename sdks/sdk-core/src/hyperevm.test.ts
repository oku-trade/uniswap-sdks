import { CHAIN_TO_ADDRESSES_MAP, V2_FACTORY_ADDRESSES, V2_ROUTER_ADDRESSES } from './addresses'
import { ChainId } from './chains'
import { WETH9 } from './entities/weth9'

/**
 * Snapshot of Uniswap/contracts deployments/json/999.json ("latest"), fetched 2026-10-02.
 * The fork's HyperEVM entries must match upstream's canonical deployment record exactly.
 */
const UPSTREAM_999 = {
  UniswapV2Factory: '0x89e5db8b5aa49aa85ac63f691524311aeb649eba',
  UniswapV2Router02: '0x1f7d7550b1b028f7571e69a784071f0205fd2efa',
  UniswapV3Factory: '0xf0db7b58379503491d857db50ac9ece64c653918',
  UniswapInterfaceMulticall: '0x33e885ed0ec9bf04ecfb19341582aadcb4c8a9e7',
  QuoterV2: '0x7dfd4f31be6814d2906bde155c3e1b146eac1468',
  TickLens: '0x9eb8600665b55d10c1eb2316ca5127a9ca6e2e76',
  NonfungiblePositionManager: '0x39654a85a4c05127f5fd6ed22caec077a0fb1377',
  V3Migrator: '0x384461c47446324ec0d861ad902fc3935c969b5c',
  SwapRouter02: '0x7adf4701abcdbc5dcf5cb58b526f897e048f0d11',
  MixedRouteQuoterV2: '0xd6a1239f7d0a47420349a80a4406eaa7a1283576',
  PoolManager: '0x12d4fd9c5dedd00ab8a0bce2cf0167bbf94b6b1f',
  PositionManager: '0x0d7ab5b3db668128aff6f70c4ebc71d7d4da9bf9',
  StateView: '0x1656326235cb9e34cb58cade53ae30789ab32a1a',
  V4Quoter: '0x108bfe38532c98f8cd8d7ab49c9ddaa3675a1c5e',
  PermissionedPositionManager: '0xbbbcc62853a5fa27b93d6bab3e6f7ce841e25df2',
}

const lc = (a: string | undefined) => a?.toLowerCase()

describe('HyperEVM (999) matches Uniswap/contracts deployments/json/999.json', () => {
  const a = CHAIN_TO_ADDRESSES_MAP[ChainId.HYPEREVM]

  it.each([
    ['v3CoreFactoryAddress', () => a.v3CoreFactoryAddress, UPSTREAM_999.UniswapV3Factory],
    ['multicallAddress', () => a.multicallAddress, UPSTREAM_999.UniswapInterfaceMulticall],
    ['quoterAddress (QuoterV2)', () => a.quoterAddress, UPSTREAM_999.QuoterV2],
    ['tickLensAddress', () => a.tickLensAddress, UPSTREAM_999.TickLens],
    [
      'nonfungiblePositionManagerAddress',
      () => a.nonfungiblePositionManagerAddress,
      UPSTREAM_999.NonfungiblePositionManager,
    ],
    ['v3MigratorAddress', () => a.v3MigratorAddress, UPSTREAM_999.V3Migrator],
    ['swapRouter02Address', () => a.swapRouter02Address, UPSTREAM_999.SwapRouter02],
    ['mixedRouteQuoterV2Address', () => a.mixedRouteQuoterV2Address, UPSTREAM_999.MixedRouteQuoterV2],
    ['v4PoolManagerAddress', () => a.v4PoolManagerAddress, UPSTREAM_999.PoolManager],
    ['v4PositionManagerAddress', () => a.v4PositionManagerAddress, UPSTREAM_999.PositionManager],
    ['v4StateView', () => a.v4StateView, UPSTREAM_999.StateView],
    ['v4QuoterAddress', () => a.v4QuoterAddress, UPSTREAM_999.V4Quoter],
    [
      'permissionedV4PositionManagerAddress',
      () => a.permissionedV4PositionManagerAddress,
      UPSTREAM_999.PermissionedPositionManager,
    ],
    ['V2_FACTORY_ADDRESSES', () => V2_FACTORY_ADDRESSES[ChainId.HYPEREVM], UPSTREAM_999.UniswapV2Factory],
    ['V2_ROUTER_ADDRESSES', () => V2_ROUTER_ADDRESSES[ChainId.HYPEREVM], UPSTREAM_999.UniswapV2Router02],
  ])('%s', (_name, get, expected) => {
    expect(lc(get())).toEqual(expected)
  })

  it('wraps native HYPE as WHYPE (0x5555...5555, 18 decimals)', () => {
    const w = WETH9[ChainId.HYPEREVM]
    expect(lc(w.address)).toEqual('0x5555555555555555555555555555555555555555')
    expect(w.decimals).toEqual(18)
    expect(w.symbol).toEqual('WHYPE')
  })
})

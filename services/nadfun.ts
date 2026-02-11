import type { Address, PublicClient, Hex } from 'viem';
import { decodeEventLog } from 'viem';

export type NadfunNetwork = 'testnet' | 'mainnet';

export const NADFUN_NETWORK: NadfunNetwork = 'mainnet';

export const NADFUN_API_BASE_URL: Record<NadfunNetwork, string> = {
  testnet: 'https://dev-api.nad.fun',
  mainnet: 'https://api.nadapp.net',
};

export const NADFUN_CONTRACTS: Record<
  NadfunNetwork,
  {
    BONDING_CURVE_ROUTER: Address;
    LENS: Address;
    CURVE: Address;
  }
> = {
  testnet: {
    BONDING_CURVE_ROUTER: '0x865054F0F6A288adaAc30261731361EA7E908003',
    LENS: '0xB056d79CA5257589692699a46623F901a3BB76f1',
    CURVE: '0x1228b0dc9481C11D3071E7A924B794CfB038994e',
  },
  mainnet: {
    BONDING_CURVE_ROUTER: '0x6F6B8F1a20703309951a5127c45B49b1CD981A22',
    LENS: '0x7e78A8DE94f21804F7a17F4E8BF9EC2c872187ea',
    CURVE: '0xA7283d07812a02AFB7C09B60f8896bCEA3F90aCE',
  },
};

export const bondingCurveRouterAbi = [
  {
    type: 'function',
    name: 'create',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        internalType: 'struct IBondingCurveRouter.TokenCreationParams',
        components: [
          { name: 'name', type: 'string', internalType: 'string' },
          { name: 'symbol', type: 'string', internalType: 'string' },
          { name: 'tokenURI', type: 'string', internalType: 'string' },
          { name: 'amountOut', type: 'uint256', internalType: 'uint256' },
          { name: 'salt', type: 'bytes32', internalType: 'bytes32' },
          { name: 'actionId', type: 'uint8', internalType: 'uint8' },
        ],
      },
    ],
    outputs: [
      { name: 'token', type: 'address', internalType: 'address' },
      { name: 'pool', type: 'address', internalType: 'address' },
    ],
    stateMutability: 'payable',
  },
] as const;

export const lensAbi = [
  {
    type: 'function',
    name: 'getInitialBuyAmountOut',
    inputs: [{ name: '_amountIn', type: 'uint256', internalType: 'uint256' }],
    outputs: [{ name: 'amountOut', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
] as const;

export const curveAbi = [
  {
    type: 'function',
    name: 'feeConfig',
    inputs: [],
    outputs: [
      { name: 'deployFeeAmount', type: 'uint256', internalType: 'uint256' },
      { name: 'graduateFeeAmount', type: 'uint256', internalType: 'uint256' },
      { name: 'protocolFee', type: 'uint24', internalType: 'uint24' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'CurveCreate',
    inputs: [
      { name: 'creator', type: 'address', indexed: true, internalType: 'address' },
      { name: 'token', type: 'address', indexed: true, internalType: 'address' },
      { name: 'pool', type: 'address', indexed: true, internalType: 'address' },
      { name: 'name', type: 'string', indexed: false, internalType: 'string' },
      { name: 'symbol', type: 'string', indexed: false, internalType: 'string' },
      { name: 'tokenURI', type: 'string', indexed: false, internalType: 'string' },
      { name: 'virtualMon', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'virtualToken', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'targetTokenAmount', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
    anonymous: false,
  },
] as const;

export interface UploadImageResult {
  imageUri: string;
  isNsfw: boolean;
}

export interface UploadMetadataParams {
  imageUri: string;
  name: string;
  symbol: string;
  description: string;
  website?: string;
  twitter?: string;
  telegram?: string;
}

export interface UploadMetadataResult {
  metadataUri: string;
  metadata: {
    name: string;
    symbol: string;
    description: string;
    imageUri: string;
    website?: string;
    twitter?: string;
    telegram?: string;
    isNsfw: boolean;
  };
}

export interface MineSaltParams {
  creator: Address;
  name: string;
  symbol: string;
  metadataUri: string;
}

export interface MineSaltResult {
  salt: `0x${string}`;
  address: Address;
}

export interface FeeConfig {
  deployFeeAmount: bigint;
  graduateFeeAmount: bigint;
  protocolFee: number;
}

export const uploadImage = async (
  image: Blob,
  contentType: string,
  network: NadfunNetwork = NADFUN_NETWORK,
): Promise<UploadImageResult> => {
  const res = await fetch(`${NADFUN_API_BASE_URL[network]}/metadata/image`, {
    method: 'POST',
    headers: { 'Content-Type': contentType },
    body: image,
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => ({ error: 'Unknown error' })) as { error?: string };
    throw new Error(`Nad.fun image upload failed: ${payload.error || res.statusText}`);
  }
  const data = await res.json() as { image_uri: string; is_nsfw: boolean };
  return { imageUri: data.image_uri, isNsfw: data.is_nsfw };
};

export const uploadMetadata = async (
  params: UploadMetadataParams,
  network: NadfunNetwork = NADFUN_NETWORK,
): Promise<UploadMetadataResult> => {
  const res = await fetch(`${NADFUN_API_BASE_URL[network]}/metadata/metadata`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image_uri: params.imageUri,
      name: params.name,
      symbol: params.symbol,
      description: params.description,
      website: params.website ?? null,
      twitter: params.twitter ?? null,
      telegram: params.telegram ?? null,
    }),
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => ({ error: 'Unknown error' })) as { error?: string };
    throw new Error(`Nad.fun metadata upload failed: ${payload.error || res.statusText}`);
  }
  const data = await res.json() as {
    metadata_uri: string;
    metadata: {
      name: string;
      symbol: string;
      description: string;
      image_uri: string;
      website?: string;
      twitter?: string;
      telegram?: string;
      is_nsfw: boolean;
    };
  };
  return {
    metadataUri: data.metadata_uri,
    metadata: {
      name: data.metadata.name,
      symbol: data.metadata.symbol,
      description: data.metadata.description,
      imageUri: data.metadata.image_uri,
      website: data.metadata.website,
      twitter: data.metadata.twitter,
      telegram: data.metadata.telegram,
      isNsfw: data.metadata.is_nsfw,
    },
  };
};

export const mineSalt = async (
  params: MineSaltParams,
  network: NadfunNetwork = NADFUN_NETWORK,
): Promise<MineSaltResult> => {
  const res = await fetch(`${NADFUN_API_BASE_URL[network]}/token/salt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      creator: params.creator,
      name: params.name,
      symbol: params.symbol,
      metadata_uri: params.metadataUri,
    }),
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => ({ error: 'Unknown error' })) as { error?: string };
    throw new Error(`Nad.fun salt mining failed: ${payload.error || res.statusText}`);
  }
  const data = await res.json() as { salt: string; address: string };
  return { salt: data.salt as `0x${string}`, address: data.address as Address };
};

export const getFeeConfig = async (
  publicClient: PublicClient,
  network: NadfunNetwork = NADFUN_NETWORK,
): Promise<FeeConfig> => {
  const result = await publicClient.readContract({
    address: NADFUN_CONTRACTS[network].CURVE,
    abi: curveAbi,
    functionName: 'feeConfig',
  });
  return {
    deployFeeAmount: result[0],
    graduateFeeAmount: result[1],
    protocolFee: Number(result[2]),
  };
};

export const getInitialBuyAmountOut = async (
  publicClient: PublicClient,
  amountIn: bigint,
  network: NadfunNetwork = NADFUN_NETWORK,
): Promise<bigint> => {
  return publicClient.readContract({
    address: NADFUN_CONTRACTS[network].LENS,
    abi: lensAbi,
    functionName: 'getInitialBuyAmountOut',
    args: [amountIn],
  });
};

export const parseCurveCreateFromReceipt = (receipt: { logs: Array<{ data: Hex; topics: Hex[] }> }) => {
  for (const log of receipt.logs) {
    try {
      const event = decodeEventLog({
        abi: curveAbi,
        data: log.data,
        topics: log.topics,
      });
      if (event.eventName === 'CurveCreate') {
        return {
          token: event.args.token as Address,
          pool: event.args.pool as Address,
        };
      }
    } catch {
      // ignore
    }
  }
  return null;
};

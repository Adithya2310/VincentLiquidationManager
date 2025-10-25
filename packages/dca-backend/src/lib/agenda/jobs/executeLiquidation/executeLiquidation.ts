import * as Sentry from '@sentry/node';
import { Job } from '@whisthub/agenda';
import consola from 'consola';
import { ethers } from 'ethers';

import { IRelayPKP } from '@lit-protocol/types';

import { env } from '../../../env';
import { normalizeError } from '../../../error';
import { getUserPermittedVersion } from '../executeDCASwap/utils';
import { getLiquidationAbilityClient } from '../executeDCASwap/vincentAbilities';
import { type AppData, assertPermittedVersion } from '../jobVersion';

export type JobType = Job<JobParams>;
export type JobParams = {
  app: AppData;
  name: string;
  pkpInfo: IRelayPKP;
  updatedAt: Date;
  usersToMonitor: string[];
};

const VAULT_ADDRESS = '0x5cB49a8fEfaB8F0ac85D84bD5B7A87ccE236C6ef';

const vaultAbi = ['function isLiquidatable(address) view returns (bool)'];

const { BASE_RPC_URL, VINCENT_APP_ID } = env;
const SEPOLIA_RPC_URL = BASE_RPC_URL;

export async function executeLiquidation(job: JobType, sentryScope: Sentry.Scope): Promise<void> {
  try {
    const {
      _id,
      data: {
        app,
        pkpInfo: { ethAddress },
        usersToMonitor = ['0xE5ed485578d6a646D417002a06823584059FBe31'],
      },
    } = job.attrs;

    consola.log('Starting liquidation monitor job...', {
      _id,
      ethAddress,
      usersToMonitor,
    });

    // 1) Verify permitted app version
    const userPermittedAppVersion = await getUserPermittedVersion({
      ethAddress,
      appId: VINCENT_APP_ID,
    });
    if (!userPermittedAppVersion) {
      throw new Error(
        `User ${ethAddress} revoked permission to run this app. Used version to generate: ${app.version}`
      );
    }
    const appVersionToRun = assertPermittedVersion(app.version, userPermittedAppVersion);
    if (appVersionToRun !== app.version) {
      // eslint-disable-next-line no-param-reassign
      job.attrs.data.app = { ...job.attrs.data.app, version: appVersionToRun } as any;
      await job.save();
    }

    const provider = new ethers.providers.JsonRpcProvider(SEPOLIA_RPC_URL);
    const vault = new ethers.Contract(VAULT_ADDRESS, vaultAbi, provider);

    const liquidationAbilityClient = getLiquidationAbilityClient();

    await Promise.all(
      usersToMonitor.map(async (user) => {
        const liquidatable: boolean = await vault.isLiquidatable(user);
        consola.debug('Checked isLiquidatable', { liquidatable, user });
        if (!liquidatable) {
          return;
        }

        // Precheck & Execute
        const abilityParams = {
          rpcUrl: SEPOLIA_RPC_URL,
          userToLiquidate: user,
          vaultAddress: VAULT_ADDRESS,

          amount: '1',
          // schema-required placeholders (unused in ability logic)
          to: '0x0000000000000000000000000000000000000001',
        } as any;

        const context = { delegatorPkpEthAddress: ethAddress } as const;

        const pre = await liquidationAbilityClient.precheck(abilityParams, context);
        consola.debug('Liquidation precheck result', pre);
        if (!pre.success) {
          throw new Error(
            `Liquidation precheck failed: ${pre.runtimeError || (pre as any).result?.error}`
          );
        }

        const exec = await liquidationAbilityClient.execute(abilityParams, context);
        consola.info('Liquidation execution result', exec);
        if (!exec.success) {
          throw new Error(
            `Liquidation execute failed: ${exec.runtimeError || (exec as any).result?.error}`
          );
        }

        // Success - log tx hashes
        consola.log('Liquidation tx', {
          user,
          approvalTxHash: (exec as any).result?.approvalTxHash,
          liquidationTxHash: (exec as any).result?.liquidationTxHash,
        });
      })
    );
  } catch (e) {
    const err = normalizeError(e);
    sentryScope.captureException(err);
    consola.error(err.message, err.stack);
    throw e;
  }
}

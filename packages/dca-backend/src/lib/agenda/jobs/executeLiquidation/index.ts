import { executeLiquidation } from './executeLiquidation';

import type { JobType, JobParams } from './executeLiquidation';

export const jobName = 'check-and-liquidate';
export const processJob = executeLiquidation;
export type { JobType, JobParams };

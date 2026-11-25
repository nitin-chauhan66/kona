import { DrcRule } from '../types.js';
import { missingModuleRule } from './missing-module.rule.js';
import { netConnectivityRule } from './net-connectivity.rule.js';
import { clockResetRule } from './clock-reset.rule.js';

export { missingModuleRule, netConnectivityRule, clockResetRule };

export const BUILTIN_DRC_RULES: DrcRule[] = [
  missingModuleRule,
  netConnectivityRule,
  clockResetRule
];

import { DrcRule } from '../types.js';
import { missingModuleRule } from './missing-module.rule.js';
import { netConnectivityRule } from './net-connectivity.rule.js';
import { clockResetRule } from './clock-reset.rule.js';
import { siliconPdkRule } from './silicon-pdk.rule.js';
import { svIdentifierRule } from './sv-identifier.rule.js';

export { missingModuleRule, netConnectivityRule, clockResetRule, siliconPdkRule, svIdentifierRule };

export const BUILTIN_DRC_RULES: DrcRule[] = [
  missingModuleRule,
  netConnectivityRule,
  clockResetRule,
  siliconPdkRule,
  svIdentifierRule
];

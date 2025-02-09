import { createTypedHooks } from 'easy-peasy';
import { MailMergePModel } from '../types/modelTypes';

const typedHooks = createTypedHooks<MailMergePModel>();

export const useStoreActions = typedHooks.useStoreActions;
export const useStoreDispatch = typedHooks.useStoreDispatch;
export const useStoreState = typedHooks.useStoreState;
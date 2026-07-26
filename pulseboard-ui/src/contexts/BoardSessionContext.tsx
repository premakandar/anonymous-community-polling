import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { BBoardDerivedState, DeployedBBoardAPI } from '../../../api/src/index';
import { State } from '../../../contract/src/index';
import { useDeployedBoardContext } from '../hooks';
import type { BoardDeployment } from './BrowserDeployedBoardManager';
import { loadConfig, saveContractAddressOverride, type AppConfig } from '../config';
import { pushActivity } from '../lib/activity';

type SessionStatus = 'idle' | 'connecting' | 'ready' | 'failed';

type BoardSessionValue = {
  config: AppConfig;
  status: SessionStatus;
  api: DeployedBBoardAPI | null;
  boardState: BBoardDerivedState | null;
  error: string | null;
  busy: boolean;
  actionError: string | null;
  deploy: () => void;
  join: (address: string) => void;
  post: (message: string) => Promise<void>;
  takeDown: () => Promise<void>;
  setContractAddress: (address: string) => void;
  clearContractOverride: () => void;
  isVacant: boolean;
  isOccupied: boolean;
};

const BoardSessionContext = createContext<BoardSessionValue | null>(null);

export function BoardSessionProvider({ children }: { children: ReactNode }) {
  const provider = useDeployedBoardContext();
  const [config, setConfig] = useState<AppConfig>(() => loadConfig());
  const [status, setStatus] = useState<SessionStatus>('idle');
  const [api, setApi] = useState<DeployedBBoardAPI | null>(null);
  const [boardState, setBoardState] = useState<BBoardDerivedState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const onConfig = () => setConfig(loadConfig());
    window.addEventListener('pulseboard:config', onConfig);
    return () => window.removeEventListener('pulseboard:config', onConfig);
  }, []);

  useEffect(() => () => unsubRef.current?.(), []);

  const attachDeployment = useCallback(
    (deployment$: ReturnType<typeof provider.resolve>) => {
      unsubRef.current?.();
      setStatus('connecting');
      setError(null);
      setApi(null);
      setBoardState(null);

      const sub = deployment$.subscribe((deployment: BoardDeployment) => {
        if (deployment.status === 'in-progress') {
          setStatus('connecting');
          return;
        }
        if (deployment.status === 'failed') {
          setStatus('failed');
          setError(deployment.error.message);
          pushActivity('error', 'Board connection failed', deployment.error.message);
          return;
        }
        setApi(deployment.api);
        setStatus('ready');
        pushActivity('join', 'Board ready', deployment.api.deployedContractAddress);
      });

      unsubRef.current = () => sub.unsubscribe();
    },
    [provider],
  );

  const deploy = useCallback(() => {
    pushActivity('deploy', 'Deploying new board…');
    attachDeployment(provider.resolve());
  }, [attachDeployment, provider]);

  const join = useCallback(
    (address: string) => {
      const trimmed = address.trim();
      if (!trimmed) {
        setError('Enter a contract address to join.');
        return;
      }
      pushActivity('join', 'Joining board…', trimmed);
      attachDeployment(provider.resolve(trimmed));
    },
    [attachDeployment, provider],
  );

  useEffect(() => {
    if (!api) return;
    const sub = api.state$.subscribe(setBoardState);
    return () => sub.unsubscribe();
  }, [api]);

  const post = useCallback(
    async (message: string) => {
      if (!api) throw new Error('Connect to a board first.');
      setBusy(true);
      setActionError(null);
      try {
        await api.post(message);
        pushActivity('post', 'Posted community message');
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        setActionError(msg);
        pushActivity('error', 'Post failed', msg);
        throw e;
      } finally {
        setBusy(false);
      }
    },
    [api],
  );

  const takeDown = useCallback(async () => {
    if (!api) throw new Error('Connect to a board first.');
    setBusy(true);
    setActionError(null);
    try {
      await api.takeDown();
      pushActivity('take_down', 'Took down message');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setActionError(msg);
      pushActivity('error', 'Take-down failed', msg);
      throw e;
    } finally {
      setBusy(false);
    }
  }, [api]);

  const setContractAddress = useCallback((address: string) => {
    saveContractAddressOverride(address);
    setConfig(loadConfig());
    pushActivity('settings', 'Contract address updated', address.trim());
  }, []);

  const clearContractOverride = useCallback(() => {
    saveContractAddressOverride(null);
    setConfig(loadConfig());
    pushActivity('settings', 'Contract override cleared');
  }, []);

  const value = useMemo<BoardSessionValue>(
    () => ({
      config,
      status,
      api,
      boardState,
      error,
      busy,
      actionError,
      deploy,
      join,
      post,
      takeDown,
      setContractAddress,
      clearContractOverride,
      isVacant: boardState?.state === State.VACANT,
      isOccupied: boardState?.state === State.OCCUPIED,
    }),
    [
      config,
      status,
      api,
      boardState,
      error,
      busy,
      actionError,
      deploy,
      join,
      post,
      takeDown,
      setContractAddress,
      clearContractOverride,
    ],
  );

  return <BoardSessionContext.Provider value={value}>{children}</BoardSessionContext.Provider>;
}

export function useBoardSession() {
  const ctx = useContext(BoardSessionContext);
  if (!ctx) throw new Error('useBoardSession requires BoardSessionProvider');
  return ctx;
}

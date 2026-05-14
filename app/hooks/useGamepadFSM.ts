import type { ActionExecutorDeps } from "~/lib/ActionExecutor";
import type { FSMControllerState } from "~/lib/GamepadFSMController";
import type { GamepadConfig } from "~/stores/appStore";

import { useCallback, useEffect, useRef, useState } from "react";

import { GamepadFSMController } from "~/lib/GamepadFSMController";

export function useGamepadFSM(deps: ActionExecutorDeps) {
  // useState pattern holds singleton reference
  const [controllerRef] = useState(() => ({
    current: GamepadFSMController.getInstance(),
  }));
  // eslint-disable-next-line react-hooks/refs
  const [state, setState] = useState<FSMControllerState>(() => controllerRef.current.state());
  const depsRef = useRef(deps);

  useEffect(() => {
    depsRef.current = deps;
  });

  useEffect(() => {
    const ctrl = controllerRef.current;
    ctrl.setDeps(() => depsRef.current);
    ctrl.start();

    const unsubscribe = ctrl.subscribe((newState) => {
      setState(newState);
    });

    return () => {
      unsubscribe();
    };
    // For stable singleton controller, deps tracked via depsRef
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // controllerRef is a stable singleton, excluded from deps

  const handleSTTComplete = useCallback((text: string) => {
    controllerRef.current.handleSTTComplete(text);
    // For stable singleton controller reference
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAgentResponseComplete = useCallback(() => {
    controllerRef.current.handleAgentResponseComplete();
    // For stable singleton controller reference
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setConfig = useCallback((config: GamepadConfig) => {
    controllerRef.current.setConfig(config);
    // For stable singleton controller reference
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setDisabled = useCallback((disabled: boolean) => {
    controllerRef.current.setDisabled(disabled);
    // For stable singleton controller reference
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    gamepadState: state.gamepadState,
    inputState: state.inputState,
    handleSTTComplete,
    handleAgentResponseComplete,
    setConfig,
    setDisabled,
  };
}

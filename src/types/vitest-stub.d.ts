declare module 'vitest' {
  export function describe(name: string, fn: () => void | Promise<void>): void;
  export function it(name: string, fn: () => void | Promise<void>): void;
  export function beforeEach(fn: () => void | Promise<void>): void;
  export function afterEach(fn: () => void | Promise<void>): void;

  type Constructor = new (...args: unknown[]) => unknown;

  export function expect<T = unknown>(value: T): {
    toBe: (expected: T) => void;
    toEqual: (expected: unknown) => void;
    toMatchInlineSnapshot?: (snapshot?: string) => void;
    toBeInstanceOf?: (expected: Constructor) => void;
    toBeGreaterThan?: (expected: number) => void;
    toBeLessThanOrEqual?: (expected: number) => void;
    toBeTruthy?: () => void;
    toBeDefined?: () => void;
    toBeNull?: () => void;
    toHaveBeenCalledTimes?: (times: number) => void;
    toHaveBeenCalled?: () => void;
    rejects?: { toThrow: (message?: string | RegExp) => Promise<void> };
  };

  type MockFunction<Args extends unknown[] = unknown[], R = unknown> = ((...args: Args) => R) & {
    mockResolvedValue?: (value: unknown) => MockFunction<Args, Promise<unknown>>;
    mockRejectedValue?: (value: unknown) => MockFunction<Args, Promise<unknown>>;
  };

  export const vi: {
    fn: <Args extends unknown[], R = unknown>(impl?: (...args: Args) => R) => MockFunction<Args, R>;
    spyOn: <T extends object, K extends keyof T>(obj: T, method: K) => { mockRestore: () => void };
    clearAllMocks: () => void;
    restoreAllMocks: () => void;
    mock: (path: string, factory?: () => unknown) => void;
    doMock: (path: string, factory: () => unknown) => void;
  };
}


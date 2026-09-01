/**
 * In-browser Python execution for the assessment's "Run" button.
 *
 * Why this exists: every "Run" click used to POST to /api/assessment/{token}/test-code,
 * which executes ALL 8 test cases (3 visible + 5 hidden) against the external code
 * execution API. At ~5 clicks per candidate that is ~40 API calls per person before
 * they even submit, which exhausts a free Judge0 quota almost immediately.
 *
 * Running the visible tests locally makes the feedback loop free and instant.
 * Grading is untouched: submit still runs server-side against all 8 tests, so the
 * authoritative result is still produced by the backend and cannot be tampered with.
 *
 * Pyodide runs inside a Web Worker so that a candidate's infinite loop can be killed
 * by terminating the worker, instead of freezing their browser tab mid-assessment.
 */

const PYODIDE_VERSION = 'v0.27.7';
const PYODIDE_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/${PYODIDE_VERSION}/full/`;

/** Default per-test wall clock limit. Mirrors the backend's 5s subprocess timeout. */
export const DEFAULT_TIMEOUT_MS = 5000;

export interface PyRunResult {
  stdout: string;
  stderr: string;
  timedOut: boolean;
}

/**
 * Executed inside Pyodide for each test case.
 *
 * `__src` is the candidate's code and `__stdin` the test input; both are injected as
 * globals before this runs. The candidate's code executes in a fresh namespace with
 * __name__ == '__main__' so their `if __name__ == "__main__":` block runs, matching
 * how the backend invokes it (`python3 file.py`).
 */
const HARNESS_PY = `
import sys, io, builtins, traceback

_in = io.StringIO(__stdin)
_out = io.StringIO()
_err = io.StringIO()

def _input(prompt=''):
    line = _in.readline()
    if not line:
        raise EOFError('EOF when reading a line')
    return line.rstrip('\\n')

_real_input = builtins.input
_real_stdout, _real_stderr = sys.stdout, sys.stderr
builtins.input = _input
sys.stdout, sys.stderr = _out, _err

_ns = {'__name__': '__main__'}
try:
    exec(__src, _ns)
except SystemExit:
    pass
except BaseException:
    traceback.print_exc(file=_err)
finally:
    sys.stdout, sys.stderr = _real_stdout, _real_stderr
    builtins.input = _real_input

__stdout_val = _out.getvalue()
__stderr_val = _err.getvalue()
`;

const buildWorkerSource = () => `
importScripts(${JSON.stringify(PYODIDE_INDEX_URL + 'pyodide.js')});

const HARNESS = ${JSON.stringify(HARNESS_PY)};
const INDEX_URL = ${JSON.stringify(PYODIDE_INDEX_URL)};

let bootPromise = null;
function boot() {
  if (!bootPromise) bootPromise = loadPyodide({ indexURL: INDEX_URL });
  return bootPromise;
}

self.onmessage = async (ev) => {
  const msg = ev.data || {};

  if (msg.type === 'preload') {
    try {
      await boot();
      self.postMessage({ type: 'ready' });
    } catch (err) {
      self.postMessage({ type: 'boot-failed', error: String(err) });
    }
    return;
  }

  if (msg.type === 'run') {
    try {
      const py = await boot();
      py.globals.set('__src', msg.code);
      py.globals.set('__stdin', msg.stdin || '');
      py.runPython(HARNESS);
      self.postMessage({
        type: 'result',
        id: msg.id,
        stdout: py.globals.get('__stdout_val') || '',
        stderr: py.globals.get('__stderr_val') || '',
      });
    } catch (err) {
      self.postMessage({ type: 'result', id: msg.id, stdout: '', stderr: String(err) });
    }
  }
};
`;

let worker: Worker | null = null;
let workerUrl: string | null = null;
let bootFailed = false;
let nextId = 1;

function spawnWorker(): Worker | null {
  if (bootFailed) return null;
  if (worker) return worker;
  if (typeof window === 'undefined' || typeof Worker === 'undefined') return null;
  try {
    const blob = new Blob([buildWorkerSource()], { type: 'application/javascript' });
    workerUrl = URL.createObjectURL(blob);
    worker = new Worker(workerUrl);
    return worker;
  } catch {
    bootFailed = true;
    return null;
  }
}

/** Tear down after a timeout; the next run boots a clean interpreter. */
function killWorker() {
  if (worker) worker.terminate();
  if (workerUrl) URL.revokeObjectURL(workerUrl);
  worker = null;
  workerUrl = null;
}

/**
 * Start downloading Pyodide (~10MB) ahead of the first Run click.
 * Safe to call repeatedly; only the first call does work.
 */
export function preloadPyodide(): void {
  const w = spawnWorker();
  if (w) w.postMessage({ type: 'preload' });
}

/** True when in-browser execution is plausible in this environment. */
export function pyodideSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof Worker !== 'undefined' &&
    typeof Blob !== 'undefined' &&
    !bootFailed
  );
}

/**
 * Run `code` with `stdin` piped to it. Rejects if the worker cannot start, so the
 * caller can fall back to the server-side endpoint.
 */
export function runPython(
  code: string,
  stdin: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<PyRunResult> {
  return new Promise((resolve, reject) => {
    const w = spawnWorker();
    if (!w) {
      reject(new Error('Web Worker unavailable'));
      return;
    }

    const id = nextId++;
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      w.removeEventListener('message', onMessage);
      // A runaway loop cannot be interrupted from outside, so drop the whole worker.
      killWorker();
      resolve({ stdout: '', stderr: `Time limit exceeded (${timeoutMs / 1000}s)`, timedOut: true });
    }, timeoutMs);

    const onMessage = (ev: MessageEvent) => {
      const data = ev.data || {};
      if (data.type === 'boot-failed') {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        w.removeEventListener('message', onMessage);
        bootFailed = true;
        reject(new Error(data.error || 'Pyodide failed to load'));
        return;
      }
      if (data.type !== 'result' || data.id !== id) return;
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      w.removeEventListener('message', onMessage);
      resolve({ stdout: data.stdout || '', stderr: data.stderr || '', timedOut: false });
    };

    w.addEventListener('message', onMessage);
    w.addEventListener(
      'error',
      () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        bootFailed = true;
        reject(new Error('Pyodide worker error'));
      },
      { once: true }
    );

    w.postMessage({ type: 'run', id, code, stdin });
  });
}

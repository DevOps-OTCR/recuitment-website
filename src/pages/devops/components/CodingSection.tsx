import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, Play, Terminal, ChevronDown, ChevronUp, Code2, FileText } from 'lucide-react';
import type { CodingConfig, SubmitResponse } from '@/lib/assessment-api';
import { assessmentApi } from '@/lib/assessment-api';
import { runPython, preloadPyodide, pyodideSupported } from '@/lib/pyodide-runner';

// Convert markdown-like text to HTML (tighter spacing, no big paragraph gaps)
const formatDescription = (text: string): string => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/__(.+?)__/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/_([^_]+)_/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code class="bg-zinc-800 px-1.5 py-0.5 rounded text-teal-400 font-mono text-xs">$1</code>')
    .replace(/^### (.+)$/gm, '<h3 class="text-white font-semibold mt-3 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-white font-semibold text-lg mt-3 mb-1">$1</h2>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4">$2</li>')
    .replace(/^[-•] (.+)$/gm, '<li class="ml-4">$1</li>')
    .replace(/(<li[^>]*>.*<\/li>\n?)+/g, (match) => `<ul class="list-disc pl-4 space-y-1 my-2">${match}</ul>`)
    // Keep single newlines tight, double newlines just add a small break
    .replace(/\n\n+/g, '<br><br>')
    .replace(/\n/g, '<br>')
    // Collapse runs of <br> to avoid large gaps
    .replace(/(<br>\s*){3,}/g, '<br><br>');
};

interface CodingSectionProps {
  config: CodingConfig;
  token: string;
  onSubmit: (payload: { code: string; language: string }) => Promise<SubmitResponse>;
  onBack: () => void;
  codeDraft: string;
  onCodeChange: (code: string) => void;
  submitting: boolean;
}

const CodingSection = ({
  config,
  token,
  onSubmit,
  onBack,
  codeDraft,
  onCodeChange,
  submitting,
}: CodingSectionProps) => {
  const [code, setCode] = useState(codeDraft || config.problem.starterCode);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitResponse['coding_result'] | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [testingCode, setTestingCode] = useState(false);
  const [activeTestCase, setActiveTestCase] = useState(0);
  const [consoleOpen, setConsoleOpen] = useState(true);

  useEffect(() => {
    setCode(codeDraft || config.problem.starterCode);
  }, [codeDraft, config.problem.starterCode]);

  // Start fetching Pyodide as soon as the candidate opens this section, so the
  // first Run click is not stuck behind a ~10MB download.
  useEffect(() => {
    if (pyodideSupported()) preloadPyodide();
  }, []);

  /**
   * Run the VISIBLE test cases in the browser.
   *
   * Pass/fail matches the backend exactly: compare trimmed stdout against trimmed
   * expectedOutput. stderr is surfaced to the candidate but does not by itself fail
   * a test, mirroring run_code_tests() server-side.
   */
  const runVisibleTestsLocally = async (): Promise<
    NonNullable<SubmitResponse['coding_result']>
  > => {
    const details = [];
    let passed = 0;

    for (let i = 0; i < config.testCases.length; i++) {
      const tc = config.testCases[i];
      const run = await runPython(code, tc.input ?? '');
      const actual = (run.stdout || '').trim();
      const expected = (tc.expectedOutput || '').trim();
      const ok = !run.timedOut && actual === expected;
      if (ok) passed++;
      details.push({
        test: i + 1,
        passed: ok,
        expected,
        actual,
        error: run.stderr || '',
      });
    }

    return { passed, total: config.testCases.length, details };
  };

  const handleTest = async () => {
    if (!code.trim()) {
      setError('Please write some code before testing.');
      return;
    }

    setError(null);
    setTestingCode(true);
    setConsoleOpen(true);
    try {
      let testResult: SubmitResponse['coding_result'] | null = null;

      // Prefer in-browser execution. Falls through to the server endpoint if
      // Pyodide is unavailable or fails to boot.
      if (pyodideSupported()) {
        try {
          testResult = await runVisibleTestsLocally();
        } catch {
          testResult = null;
        }
      }

      if (!testResult) {
        testResult = (await assessmentApi.testCode(token, code, 'python3')) || null;
      }

      setResult(testResult);
    } catch (err: any) {
      setError(err.message || 'Failed to run tests. Please try again.');
    } finally {
      setTestingCode(false);
    }
  };

  const handleSubmit = async () => {
    if (!code.trim()) {
      setError('Please write some code before submitting.');
      return;
    }

    setError(null);
    try {
      const response = await onSubmit({ code, language: 'python3' });
      setResult(response.coding_result || null);
      setSubmitted(true);
      setConsoleOpen(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit. Please try again.');
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    const newCode = value || '';
    setCode(newCode);
    onCodeChange(newCode);
  };

  return (
    <div className="h-[calc(100vh-120px)] flex rounded-lg overflow-hidden border border-teal-500/30">
      {/* Left Panel - Problem Description (OTCR Style) */}
      <div className="w-[45%] flex flex-col bg-[#0a1628] border-r border-teal-500/30">
        {/* Tabs */}
        <div className="flex items-center gap-1 px-3 py-2 bg-[#0d1d33] border-b border-teal-500/30">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#0a1628] rounded-t border-t border-l border-r border-teal-500/30 -mb-[1px]">
            <FileText className="w-3.5 h-3.5 text-teal-400" />
            Description
          </button>
        </div>

        {/* Problem Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-5">
            {/* Title */}
            <h1 className="text-xl font-semibold text-white mb-3">
              {config.problem.title}
            </h1>

            {/* Description */}
            <div 
              className="text-[13px] text-zinc-400 leading-relaxed [&_strong]:font-semibold [&_code]:text-xs"
              dangerouslySetInnerHTML={{ __html: formatDescription(config.problem.description) }}
            />

            {/* Examples */}
            <div className="mt-6 space-y-5">
              {config.testCases.map((tc, i) => (
                <div key={i}>
                  <h3 className="text-sm font-semibold text-white mb-2">
                    Example {i + 1}:
                  </h3>
                  <div className="bg-[#0d1d33] rounded-lg border border-teal-500/20 overflow-hidden">
                    <pre className="p-3 text-[13px] font-mono text-zinc-300 whitespace-pre-wrap leading-relaxed">
                      <span className="text-zinc-500">Input:</span>
                      {'\n'}{tc.input}
                      {'\n\n'}
                      <span className="text-zinc-500">Output:</span> {tc.expectedOutput}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Code Editor */}
      <div className="flex-1 flex flex-col bg-[#0a1628]">
        {/* Editor Header */}
        <div className="flex items-center justify-between px-3 py-2 bg-[#0d1d33] border-b border-teal-500/30">
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#0a1628] rounded-t border-t border-l border-r border-teal-500/30 -mb-[1px]">
              <Code2 className="w-3.5 h-3.5 text-teal-400" />
              Code
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-300 bg-[#0a1628] rounded border border-teal-500/30">
              <span className="text-teal-400">●</span>
              Python 3
              <ChevronDown className="w-3 h-3 text-zinc-500" />
            </div>
          </div>
        </div>

        {/* Code Editor Area */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className={`${consoleOpen ? 'h-[55%]' : 'flex-1'} flex flex-col min-h-0 transition-all`}>
            {/* Monaco Editor */}
            <div className="flex-1 min-h-0">
              <Editor
                height="100%"
                defaultLanguage="python"
                value={code}
                onChange={handleEditorChange}
                theme="vs-dark"
                options={{
                  fontSize: 13,
                  fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
                  lineHeight: 21,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  renderLineHighlight: 'line',
                  lineNumbers: 'on',
                  glyphMargin: false,
                  folding: true,
                  lineDecorationsWidth: 8,
                  lineNumbersMinChars: 3,
                  renderIndentGuides: true,
                  guides: {
                    indentation: true,
                    highlightActiveIndentation: true,
                    bracketPairs: true,
                  },
                  tabSize: 4,
                  insertSpaces: true,
                  automaticLayout: true,
                  wordWrap: 'off',
                  padding: { top: 12, bottom: 12 },
                  scrollbar: {
                    vertical: 'auto',
                    horizontal: 'auto',
                    verticalScrollbarSize: 10,
                    horizontalScrollbarSize: 10,
                  },
                  overviewRulerLanes: 0,
                  hideCursorInOverviewRuler: true,
                  overviewRulerBorder: false,
                  readOnly: submitted,
                  cursorBlinking: 'smooth',
                  cursorSmoothCaretAnimation: 'on',
                  smoothScrolling: true,
                }}
                beforeMount={(monaco) => {
                  // Define custom theme matching OTCR colors
                  monaco.editor.defineTheme('otcr-dark', {
                    base: 'vs-dark',
                    inherit: true,
                    rules: [
                      { token: 'comment', foreground: '6b7280', fontStyle: 'italic' },
                      { token: 'keyword', foreground: '5eead4' },
                      { token: 'string', foreground: 'fbbf24' },
                      { token: 'number', foreground: 'f472b6' },
                      { token: 'function', foreground: '60a5fa' },
                      { token: 'variable', foreground: 'e4e4e7' },
                      { token: 'type', foreground: '34d399' },
                    ],
                    colors: {
                      'editor.background': '#0a1628',
                      'editor.foreground': '#e4e4e7',
                      'editor.lineHighlightBackground': '#0d1d33',
                      'editor.selectionBackground': '#2dd4bf30',
                      'editorLineNumber.foreground': '#2dd4bf50',
                      'editorLineNumber.activeForeground': '#2dd4bf',
                      'editorIndentGuide.background': '#2dd4bf25',
                      'editorIndentGuide.activeBackground': '#2dd4bf50',
                      'editor.selectionHighlightBackground': '#2dd4bf20',
                      'editorCursor.foreground': '#5eead4',
                      'editorWhitespace.foreground': '#2dd4bf20',
                      'scrollbarSlider.background': '#2dd4bf20',
                      'scrollbarSlider.hoverBackground': '#2dd4bf40',
                      'scrollbarSlider.activeBackground': '#2dd4bf60',
                    },
                  });
                }}
                onMount={(editor, monaco) => {
                  // Apply custom theme after mount
                  monaco.editor.setTheme('otcr-dark');
                  
                  // Focus the editor
                  editor.focus();
                }}
                loading={
                  <div className="flex items-center justify-center h-full bg-[#0a1628]">
                    <Loader2 className="w-6 h-6 text-teal-400 animate-spin" />
                  </div>
                }
              />
            </div>
          </div>

          {/* Console Panel (OTCR Style) */}
          {consoleOpen && (
            <div className="h-[45%] flex flex-col border-t border-teal-500/30 bg-[#0a1628]">
              {/* Console Header */}
              <div className="flex items-center justify-between px-4 py-2 bg-[#0d1d33] border-b border-teal-500/30">
                <div className="flex items-center gap-4">
                  <button 
                    className={`text-xs font-medium px-1 pb-1 ${
                      !result ? 'text-white border-b-2 border-teal-500' : 'text-zinc-400 hover:text-white'
                    }`}
                    onClick={() => setResult(null)}
                  >
                    Testcase
                  </button>
                  {result && (
                    <button 
                      className="text-xs font-medium px-1 pb-1 text-white border-b-2 border-teal-500"
                    >
                      Test Result
                    </button>
                  )}
                </div>
                <button 
                  onClick={() => setConsoleOpen(false)}
                  className="text-zinc-400 hover:text-white p-1 rounded hover:bg-teal-500/20"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              {/* Console Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {result ? (
                  /* Test Results */
                  <div className="space-y-4">
                    {/* Status Header */}
                    <div className={`flex items-center gap-2 ${
                      result.passed === result.total ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {result.passed === result.total ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <XCircle className="w-5 h-5" />
                      )}
                      <span className="font-semibold text-lg">
                        {result.passed === result.total ? 'Accepted' : 'Wrong Answer'}
                      </span>
                      <span className="text-zinc-500 text-sm ml-2">
                        {result.passed}/{result.total} testcases passed
                      </span>
                    </div>

                    {/* Test Case Tabs */}
                    <div className="flex items-center gap-2 border-b border-teal-500/20 pb-2">
                      {result.details?.map((detail, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveTestCase(i)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                            activeTestCase === i 
                              ? 'bg-teal-500/20 text-white' 
                              : 'text-zinc-400 hover:text-white hover:bg-teal-500/10'
                          }`}
                        >
                          {detail.passed ? (
                            <CheckCircle className="w-3 h-3 text-green-500" />
                          ) : (
                            <XCircle className="w-3 h-3 text-red-500" />
                          )}
                          Case {i + 1}
                        </button>
                      ))}
                    </div>

                    {/* Active Test Case Details */}
                    {result.details && result.details[activeTestCase] && (
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs text-teal-400/70 mb-2 font-medium">Input =</p>
                          <div className="bg-[#0d1d33] rounded-lg p-3 border border-teal-500/20">
                            <pre className="text-[13px] font-mono text-white whitespace-pre-wrap">
                              {config.testCases[activeTestCase]?.input || 'N/A'}
                            </pre>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-teal-400/70 mb-2 font-medium">Output =</p>
                          <div className={`rounded-lg p-3 border ${
                            result.details[activeTestCase].passed 
                              ? 'bg-green-500/5 border-green-500/30' 
                              : 'bg-red-500/5 border-red-500/30'
                          }`}>
                            <pre className={`text-[13px] font-mono whitespace-pre-wrap ${
                              result.details[activeTestCase].passed ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {result.details[activeTestCase].actual || 'No output'}
                            </pre>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-teal-400/70 mb-2 font-medium">Expected =</p>
                          <div className="bg-[#0d1d33] rounded-lg p-3 border border-teal-500/20">
                            <pre className="text-[13px] font-mono text-white whitespace-pre-wrap">
                              {result.details[activeTestCase].expected || 'N/A'}
                            </pre>
                          </div>
                        </div>
                        {result.details[activeTestCase].error && (
                          <div>
                            <p className="text-xs text-red-400 mb-2 font-medium">Stderr</p>
                            <div className="bg-red-500/10 rounded-lg p-3 border border-red-500/30">
                              <pre className="text-[13px] font-mono text-red-400 whitespace-pre-wrap">
                                {result.details[activeTestCase].error}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Test Case Input (before running) */
                  <div className="space-y-4">
                    {/* Test Case Tabs */}
                    <div className="flex items-center gap-2 border-b border-teal-500/20 pb-2">
                      {config.testCases.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveTestCase(i)}
                          className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                            activeTestCase === i 
                              ? 'bg-teal-500/20 text-white' 
                              : 'text-zinc-400 hover:text-white hover:bg-teal-500/10'
                          }`}
                        >
                          Case {i + 1}
                        </button>
                      ))}
                    </div>

                    {/* Selected Test Case */}
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-teal-400/70 mb-2 font-medium">Input =</p>
                        <div className="bg-[#0d1d33] rounded-lg p-3 border border-teal-500/20">
                          <pre className="text-[13px] font-mono text-white whitespace-pre-wrap">
                            {config.testCases[activeTestCase]?.input}
                          </pre>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-teal-400/70 mb-2 font-medium">Expected Output =</p>
                        <div className="bg-[#0d1d33] rounded-lg p-3 border border-teal-500/20">
                          <pre className="text-[13px] font-mono text-white whitespace-pre-wrap">
                            {config.testCases[activeTestCase]?.expectedOutput}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Collapsed Console Toggle */}
          {!consoleOpen && (
            <button 
              onClick={() => setConsoleOpen(true)}
              className="flex items-center gap-2 px-4 py-2 border-t border-teal-500/30 bg-[#0d1d33] text-zinc-400 hover:text-white text-xs transition-colors"
            >
              <Terminal className="w-4 h-4" />
              Console
              <ChevronUp className="w-3 h-3 ml-auto" />
            </button>
          )}
        </div>

        {/* Bottom Action Bar (OTCR Style) */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#0d1d33] border-t border-teal-500/30">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={onBack}
              disabled={submitting || submitted}
              className="h-8 px-3 text-xs font-medium border-teal-500/50 text-white hover:bg-teal-500/20 hover:border-teal-400"
            >
              ← Back to Problem Solving
            </Button>
            <button 
              onClick={() => setConsoleOpen(!consoleOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-400 hover:text-white rounded hover:bg-teal-500/20 transition-colors"
            >
              <Terminal className="w-4 h-4" />
              Console
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            {error && (
              <span className="text-xs text-red-400 mr-2">{error}</span>
            )}
            
            <Button
              onClick={handleTest}
              disabled={testingCode || submitted}
              variant="outline"
              className="h-8 px-5 text-xs font-medium bg-transparent border-teal-500/50 text-white hover:bg-teal-500/20 hover:text-white hover:border-teal-400 rounded-md"
            >
              {testingCode ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 mr-1.5" />
                  Run
                </>
              )}
            </Button>
            
            <Button
              onClick={handleSubmit}
              disabled={submitting || submitted}
              className={`h-8 px-5 text-xs font-medium rounded-md ${
                submitted 
                  ? 'bg-green-600 hover:bg-green-600 text-white' 
                  : 'bg-teal-600 hover:bg-teal-500 text-white'
              }`}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Submitting...
                </>
              ) : submitted ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                  Submitted
                </>
              ) : (
                'Submit'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodingSection;

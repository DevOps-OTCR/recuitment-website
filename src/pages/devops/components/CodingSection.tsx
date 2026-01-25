import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, Play, Terminal, ChevronDown, ChevronUp, Code2, FileText } from 'lucide-react';
import type { CodingConfig, SubmitResponse } from '@/lib/assessment-api';
import { assessmentApi } from '@/lib/assessment-api';

// Convert markdown-like text to HTML
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
    .replace(/^### (.+)$/gm, '<h3 class="text-white font-semibold mt-4 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-white font-semibold text-lg mt-4 mb-2">$1</h2>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4">$2</li>')
    .replace(/^[-•] (.+)$/gm, '<li class="ml-4">$1</li>')
    .replace(/(<li[^>]*>.*<\/li>\n?)+/g, (match) => {
      return `<ul class="list-disc pl-4 space-y-1 my-2">${match}</ul>`;
    })
    .replace(/\n\n/g, '</p><p class="my-3">')
    .replace(/\n/g, '<br>')
    .replace(/^/, '<p class="my-3">')
    .replace(/$/, '</p>')
    .replace(/<p class="my-3"><\/p>/g, '')
    .replace(/<p class="my-3">(<h[23])/g, '$1')
    .replace(/(<\/h[23]>)<\/p>/g, '$1')
    .replace(/<p class="my-3">(<ul)/g, '$1')
    .replace(/(<\/ul>)<\/p>/g, '$1');
};

interface CodingSectionProps {
  config: CodingConfig;
  token: string;
  onSubmit: (payload: { code: string; language: string }) => Promise<SubmitResponse>;
  submitting: boolean;
}

const CodingSection = ({
  config,
  token,
  onSubmit,
  submitting,
}: CodingSectionProps) => {
  const [code, setCode] = useState(config.problem.starterCode);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitResponse['coding_result'] | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [testingCode, setTestingCode] = useState(false);
  const [activeTestCase, setActiveTestCase] = useState(0);
  const [consoleOpen, setConsoleOpen] = useState(true);

  const handleTest = async () => {
    if (!code.trim()) {
      setError('Please write some code before testing.');
      return;
    }

    setError(null);
    setTestingCode(true);
    setConsoleOpen(true);
    try {
      const testResult = await assessmentApi.testCode(token, code, 'python3');
      setResult(testResult || null);
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

  const lineCount = code.split('\n').length;

  return (
    <div className="h-[calc(100vh-120px)] flex rounded-lg overflow-hidden border border-zinc-800">
      {/* Left Panel - Problem Description (LeetCode Style) */}
      <div className="w-[45%] flex flex-col bg-[#1e1e1e] border-r border-zinc-800">
        {/* Tabs */}
        <div className="flex items-center gap-1 px-3 py-2 bg-[#2d2d2d] border-b border-zinc-700">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#1e1e1e] rounded-t border-t border-l border-r border-zinc-700 -mb-[1px]">
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

            {/* Difficulty Badge */}
            <div className="flex items-center gap-3 mb-5">
              <span className="px-2.5 py-0.5 text-xs font-medium bg-amber-500/15 text-amber-400 rounded-full">
                Medium
              </span>
            </div>

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
                  <div className="bg-[#262626] rounded-lg border border-zinc-700/50 overflow-hidden">
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
      <div className="flex-1 flex flex-col bg-[#1e1e1e]">
        {/* Editor Header */}
        <div className="flex items-center justify-between px-3 py-2 bg-[#2d2d2d] border-b border-zinc-700">
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#1e1e1e] rounded-t border-t border-l border-r border-zinc-700 -mb-[1px]">
              <Code2 className="w-3.5 h-3.5 text-teal-400" />
              Code
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-300 bg-[#1e1e1e] rounded border border-zinc-700">
              <span className="text-teal-400">●</span>
              Python 3
              <ChevronDown className="w-3 h-3 text-zinc-500" />
            </div>
          </div>
        </div>

        {/* Code Editor Area */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className={`${consoleOpen ? 'h-[55%]' : 'flex-1'} flex flex-col min-h-0 transition-all`}>
            {/* Line Numbers + Code */}
            <div className="flex-1 flex overflow-hidden bg-[#1e1e1e]">
              {/* Line Numbers */}
              <div className="w-12 bg-[#1e1e1e] text-zinc-600 text-[13px] font-mono py-3 text-right pr-4 select-none border-r border-zinc-800/50">
                {Array.from({ length: Math.max(lineCount, 20) }, (_, i) => (
                  <div key={i} className="h-[21px] leading-[21px]">{i + 1}</div>
                ))}
              </div>
              {/* Code Input */}
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="flex-1 bg-[#1e1e1e] text-zinc-200 font-mono text-[13px] py-3 px-4 resize-none outline-none leading-[21px] overflow-auto"
                spellCheck={false}
                disabled={submitted}
              />
            </div>
          </div>

          {/* Console Panel (LeetCode Style) */}
          {consoleOpen && (
            <div className="h-[45%] flex flex-col border-t border-zinc-700 bg-[#1e1e1e]">
              {/* Console Header */}
              <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-zinc-700">
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
                  className="text-zinc-400 hover:text-white p-1 rounded hover:bg-zinc-700"
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
                    <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
                      {result.details?.map((detail, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveTestCase(i)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                            activeTestCase === i 
                              ? 'bg-zinc-700 text-white' 
                              : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
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
                          <p className="text-xs text-zinc-500 mb-2 font-medium">Input =</p>
                          <div className="bg-[#262626] rounded-lg p-3 border border-zinc-700/50">
                            <pre className="text-[13px] font-mono text-white whitespace-pre-wrap">
                              {config.testCases[activeTestCase]?.input || 'N/A'}
                            </pre>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500 mb-2 font-medium">Output =</p>
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
                          <p className="text-xs text-zinc-500 mb-2 font-medium">Expected =</p>
                          <div className="bg-[#262626] rounded-lg p-3 border border-zinc-700/50">
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
                    <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
                      {config.testCases.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveTestCase(i)}
                          className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                            activeTestCase === i 
                              ? 'bg-zinc-700 text-white' 
                              : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                          }`}
                        >
                          Case {i + 1}
                        </button>
                      ))}
                    </div>

                    {/* Selected Test Case */}
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-zinc-500 mb-2 font-medium">Input =</p>
                        <div className="bg-[#262626] rounded-lg p-3 border border-zinc-700/50">
                          <pre className="text-[13px] font-mono text-white whitespace-pre-wrap">
                            {config.testCases[activeTestCase]?.input}
                          </pre>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 mb-2 font-medium">Expected Output =</p>
                        <div className="bg-[#262626] rounded-lg p-3 border border-zinc-700/50">
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
              className="flex items-center gap-2 px-4 py-2 border-t border-zinc-700 bg-[#2d2d2d] text-zinc-400 hover:text-white text-xs transition-colors"
            >
              <Terminal className="w-4 h-4" />
              Console
              <ChevronUp className="w-3 h-3 ml-auto" />
            </button>
          )}
        </div>

        {/* Bottom Action Bar (LeetCode Style) */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#2d2d2d] border-t border-zinc-700">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setConsoleOpen(!consoleOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-400 hover:text-white rounded hover:bg-zinc-700 transition-colors"
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
              className="h-8 px-5 text-xs font-medium bg-transparent border-zinc-600 text-white hover:bg-zinc-700 hover:text-white rounded-md"
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

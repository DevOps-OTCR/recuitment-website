import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, Loader2, CheckCircle, XCircle, Play, ChevronRight } from 'lucide-react';
import type { CodingConfig, SubmitResponse } from '@/lib/assessment-api';
import { assessmentApi } from '@/lib/assessment-api';

// Convert markdown-like text to HTML
const formatDescription = (text: string): string => {
  return text
    // Escape HTML first
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Bold: **text** or __text__
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white">$1</strong>')
    .replace(/__(.+?)__/g, '<strong class="text-white">$1</strong>')
    // Italic: *text* or _text_
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/_([^_]+)_/g, '<em>$1</em>')
    // Code blocks: `code`
    .replace(/`([^`]+)`/g, '<code class="bg-background/50 px-1.5 py-0.5 rounded text-primary font-mono text-xs">$1</code>')
    // Headings
    .replace(/^### (.+)$/gm, '<h3 class="text-white font-semibold mt-4 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-white font-semibold text-lg mt-4 mb-2">$1</h2>')
    // Numbered lists
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4">$2</li>')
    // Bullet lists
    .replace(/^[-•] (.+)$/gm, '<li class="ml-4">$1</li>')
    // Wrap consecutive <li> in <ol> or <ul>
    .replace(/(<li[^>]*>.*<\/li>\n?)+/g, (match) => {
      return `<ul class="list-disc pl-4 space-y-1 my-2">${match}</ul>`;
    })
    // Paragraphs (double newlines)
    .replace(/\n\n/g, '</p><p class="my-3">')
    // Single newlines to <br>
    .replace(/\n/g, '<br>')
    // Wrap in paragraph
    .replace(/^/, '<p class="my-3">')
    .replace(/$/, '</p>')
    // Clean up empty paragraphs
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

  const handleTest = async () => {
    if (!code.trim()) {
      setError('Please write some code before testing.');
      return;
    }

    setError(null);
    setTestingCode(true);
    try {
      // Use the test-code endpoint instead of submit
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
    } catch (err: any) {
      setError(err.message || 'Failed to submit. Please try again.');
    }
  };

  return (
    <div className="h-[calc(100vh-200px)] flex flex-col">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/40 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">{config.problem.title}</h1>
          <p className="text-xs text-muted-foreground mt-1">{config.instructions}</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleTest}
            disabled={testingCode || submitted}
            variant="outline"
            className="text-amber-500 border-amber-500/30 hover:bg-amber-500/10"
          >
            {testingCode ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Test
              </>
            )}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || submitted}
            className="bg-primary hover:bg-primary/90"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : submitted ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Submitted
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Submit
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Content Area - LeetCode Style Split Pane */}
      <div className="flex flex-1 overflow-hidden gap-0">
        {/* Left Panel - Problem Description */}
        <div className="w-1/2 border-r border-border/50 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Problem Description */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <span className="w-1 h-4 bg-primary rounded-full"></span>
                Description
              </h3>
              <div 
                className="text-sm text-muted-foreground leading-relaxed [&_strong]:font-semibold [&_code]:text-xs"
                dangerouslySetInnerHTML={{ __html: formatDescription(config.problem.description) }}
              />
            </div>

            {/* Test Cases - LeetCode Style */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <span className="w-1 h-4 bg-primary rounded-full"></span>
                Examples
              </h3>
              <div className="space-y-4">
                {config.testCases.map((tc, i) => (
                  <div key={i} className="space-y-2">
                    <p className="text-sm font-medium text-white">Example {i + 1}:</p>
                    <div className="bg-background/40 rounded-lg border border-border/30 overflow-hidden">
                      <div className="px-4 py-3 space-y-2">
                        <div className="flex items-start gap-2">
                          <span className="text-xs font-medium text-muted-foreground min-w-[50px]">Input:</span>
                          <pre className="text-xs font-mono text-white flex-1 whitespace-pre-wrap">{tc.input}</pre>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-xs font-medium text-muted-foreground min-w-[50px]">Output:</span>
                          <pre className="text-xs font-mono text-white flex-1 whitespace-pre-wrap">{tc.expectedOutput}</pre>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Code Editor and Results */}
        <div className="w-1/2 flex flex-col">
          {/* Code Editor */}
          <div className="flex-1 flex flex-col border-b border-border/50">
            <div className="bg-card/40 px-6 py-3 border-b border-border/30 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Python 3</span>
            </div>
            <Textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Write your Python code here..."
              className="flex-1 font-mono text-sm bg-background/50 border-0 text-white placeholder:text-muted-foreground resize-none rounded-none"
              disabled={submitted}
            />
          </div>

          {/* Test Results Panel */}
          {result && (
            <div className="flex-1 flex flex-col bg-background/30 border-t border-border/30 overflow-y-auto">
              <div className="bg-card/40 px-6 py-3 border-b border-border/30 flex items-center gap-3">
                {result.passed === result.total ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium text-green-500">
                      All Tests Passed ({result.passed}/{result.total})
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium text-yellow-500">
                      {result.passed}/{result.total} Tests Passed
                    </span>
                  </>
                )}
              </div>

              <div className="p-4 space-y-3 overflow-y-auto flex-1">
                {result.details?.map((detail, i) => (
                  <div
                    key={i}
                    className={`rounded-lg border overflow-hidden ${
                      detail.passed
                        ? 'bg-green-500/5 border-green-500/30'
                        : 'bg-red-500/5 border-red-500/30'
                    }`}
                  >
                    {/* Test Header */}
                    <div className={`px-4 py-2 flex items-center gap-2 border-b ${
                      detail.passed ? 'border-green-500/20 bg-green-500/10' : 'border-red-500/20 bg-red-500/10'
                    }`}>
                      {detail.passed ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className={`text-sm font-medium ${detail.passed ? 'text-green-400' : 'text-red-400'}`}>
                        Case {detail.test} {detail.passed ? 'Passed' : 'Failed'}
                      </span>
                    </div>
                    
                    {/* Test Details */}
                    <div className="px-4 py-3 space-y-2 text-xs font-mono">
                      {detail.expected && detail.expected !== '[hidden]' && (
                        <div className="flex items-start gap-3">
                          <span className="text-muted-foreground min-w-[70px]">Expected:</span>
                          <span className="text-white">{detail.expected}</span>
                        </div>
                      )}
                      {detail.actual && detail.actual !== '[hidden]' && (
                        <div className="flex items-start gap-3">
                          <span className="text-muted-foreground min-w-[70px]">Output:</span>
                          <span className={detail.passed ? 'text-green-400' : 'text-red-400'}>{detail.actual}</span>
                        </div>
                      )}
                      {detail.error && (
                        <div className="flex items-start gap-3">
                          <span className="text-red-400 min-w-[70px]">Error:</span>
                          <span className="text-red-400 whitespace-pre-wrap">{detail.error}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!result && (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
              <Play className="w-8 h-8 text-muted-foreground/50" />
              <span>Click "Test" to run your code</span>
            </div>
          )}
        </div>
      </div>

      {/* Error Messages */}
      {error && (
        <div className="bg-red-500/10 border-t border-red-500/30 px-6 py-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
};

export default CodingSection;

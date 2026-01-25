import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, Loader2, CheckCircle, XCircle, Play } from 'lucide-react';
import type { CodingConfig, SubmitResponse } from '@/lib/assessment-api';

interface CodingSectionProps {
  config: CodingConfig;
  onSubmit: (payload: { code: string; language: string }) => Promise<SubmitResponse>;
  submitting: boolean;
}

const CodingSection = ({
  config,
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
      const response = await onSubmit({ code, language: 'python3' });
      setResult(response.coding_result || null);
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
              <h3 className="text-sm font-semibold text-white mb-3">Description</h3>
              <pre className="whitespace-pre-wrap text-sm text-muted-foreground font-sans bg-background/30 p-4 rounded-lg border border-border/30">
                {config.problem.description}
              </pre>
            </div>

            {/* Test Cases */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">Sample Test Cases</h3>
              <div className="space-y-3">
                {config.testCases.map((tc, i) => (
                  <div key={i} className="bg-background/30 border border-border/30 rounded-lg p-4 space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium mb-1">Test Case {i + 1}</p>
                      <div className="space-y-1">
                        <p className="text-xs">
                          <span className="text-white font-medium">Input:</span>
                        </p>
                        <pre className="text-xs bg-background/50 p-2 rounded border border-border/30 overflow-x-auto">
                          {tc.input}
                        </pre>
                      </div>
                    </div>
                    <div>
                      <div className="space-y-1">
                        <p className="text-xs">
                          <span className="text-white font-medium">Expected Output:</span>
                        </p>
                        <pre className="text-xs bg-background/50 p-2 rounded border border-border/30 overflow-x-auto">
                          {tc.expectedOutput}
                        </pre>
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

              <div className="p-4 space-y-2 overflow-y-auto flex-1">
                {result.details?.map((detail, i) => (
                  <div
                    key={i}
                    className={`text-sm p-3 rounded border ${
                      detail.passed
                        ? 'bg-green-500/5 border-green-500/30 text-green-400'
                        : 'bg-red-500/5 border-red-500/30 text-red-400'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-medium mb-1">
                      {detail.passed ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                      <span>Test {detail.test}</span>
                    </div>
                    {!detail.passed && detail.error && (
                      <p className="text-xs text-muted-foreground ml-6">
                        {detail.error}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!result && (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              Run tests to see results here
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

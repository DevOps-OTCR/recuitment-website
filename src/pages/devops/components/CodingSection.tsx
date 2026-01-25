import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, Loader2, Clock, CheckCircle, XCircle, Play } from 'lucide-react';
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
    <div className="space-y-6">
      {/* Section Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-white">{config.title}</h1>
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>{config.timeEstimate}</span>
        </div>
        <p className="text-muted-foreground max-w-xl mx-auto">
          {config.instructions}
        </p>
      </div>

      {/* Problem and Editor - Side by side on desktop */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Problem Description */}
        <Card className="bg-card/60 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-lg text-white">{config.problem.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-invert prose-sm max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-muted-foreground font-sans bg-transparent p-0 overflow-visible">
                {config.problem.description}
              </pre>
            </div>
            
            {/* Sample Test Cases */}
            <div className="mt-6 space-y-3">
              <h4 className="text-sm font-medium text-white">Sample Test Cases</h4>
              {config.testCases.slice(0, 2).map((tc, i) => (
                <div key={i} className="bg-background/50 rounded-lg p-3 text-sm">
                  <div className="text-muted-foreground">
                    <span className="text-white font-medium">Input:</span>
                    <pre className="mt-1 text-xs bg-background/50 p-2 rounded">{tc.input}</pre>
                  </div>
                  <div className="text-muted-foreground mt-2">
                    <span className="text-white font-medium">Expected Output:</span>
                    <pre className="mt-1 text-xs bg-background/50 p-2 rounded">{tc.expectedOutput}</pre>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Code Editor */}
        <div className="space-y-4">
          <Card className="bg-card/60 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-white">Python 3</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Write your Python code here..."
                className="font-mono text-sm min-h-[400px] bg-background/80 border-border text-white placeholder:text-muted-foreground resize-none"
                disabled={submitted}
              />
            </CardContent>
          </Card>

          {/* Results */}
          {result && (
            <Card className={`border-2 ${result.passed === result.total ? 'border-green-500/50 bg-green-500/5' : 'border-yellow-500/50 bg-yellow-500/5'}`}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3 mb-4">
                  {result.passed === result.total ? (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  ) : (
                    <XCircle className="w-6 h-6 text-yellow-500" />
                  )}
                  <div>
                    <p className="font-medium text-white">
                      {result.passed === result.total ? 'All Tests Passed!' : 'Some Tests Failed'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {result.passed} / {result.total} test cases passed
                    </p>
                  </div>
                </div>

                {/* Test Details */}
                <div className="space-y-2">
                  {result.details?.map((detail, i) => (
                    <div
                      key={i}
                      className={`text-sm p-2 rounded ${
                        detail.passed
                          ? 'bg-green-500/10 text-green-400'
                          : 'bg-red-500/10 text-red-400'
                      }`}
                    >
                      <span className="font-medium">Test {detail.test}:</span>{' '}
                      {detail.passed ? 'Passed' : 'Failed'}
                      {!detail.passed && detail.error && (
                        <p className="text-xs mt-1 text-muted-foreground">
                          Error: {detail.error}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Submit Section */}
      <div className="space-y-4">
        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}
        
        <div className="flex items-center justify-end bg-card/40 rounded-lg px-4 py-3">
          <Button
            onClick={handleSubmit}
            disabled={submitting || submitted}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Running Tests...
              </>
            ) : submitted ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Submitted - Continue to System Design
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Run & Submit
              </>
            )}
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground text-center">
          Your code will be tested against visible and hidden test cases.
        </p>
      </div>
    </div>
  );
};

export default CodingSection;

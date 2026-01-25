import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, Loader2, Clock, Send } from 'lucide-react';
import type { SystemDesignConfig } from '@/lib/assessment-api';

interface SystemDesignSectionProps {
  config: SystemDesignConfig;
  onSubmit: (payload: { response: string }) => Promise<any>;
  submitting: boolean;
}

const SystemDesignSection = ({
  config,
  onSubmit,
  submitting,
}: SystemDesignSectionProps) => {
  const [response, setResponse] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!response.trim()) {
      setError('Please write your response before submitting.');
      return;
    }

    if (response.trim().length < 100) {
      setError('Your response seems too short. Please provide more detail.');
      return;
    }

    setError(null);
    try {
      await onSubmit({ response });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit. Please try again.');
    }
  };

  const wordCount = response.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="space-y-8">
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

      {/* Prompt Card */}
      <Card className="bg-card/60 backdrop-blur-sm border-border/50 max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-lg text-white">Design Prompt</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-invert prose-sm max-w-none">
            <pre className="whitespace-pre-wrap text-sm text-muted-foreground font-sans bg-transparent p-0 overflow-visible leading-relaxed">
              {config.prompt}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Response Area */}
      <div className="max-w-3xl mx-auto space-y-4">
        <Card className="bg-card/60 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-white">Your Response</CardTitle>
              <span className="text-xs text-muted-foreground">
                {wordCount} words
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Write your system design response here...

1. Scope – ...

2. Data flow – ...

3. Execution – ...

4. Storage – ...

5. One trade-off – ..."
              className="min-h-[400px] bg-background/50 border-border text-white placeholder:text-muted-foreground/50 resize-none leading-relaxed"
              disabled={submitted}
            />
          </CardContent>
        </Card>

        {/* Tips */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <h4 className="text-sm font-medium text-white mb-2">Tips</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Keep it concise — about half a page or a few bullets per part</li>
            <li>• Focus on clear thinking, not specific tool names</li>
            <li>• Address all 5 parts: Scope, Data flow, Execution, Storage, Trade-off</li>
          </ul>
        </div>
      </div>

      {/* Submit Section */}
      <div className="max-w-3xl mx-auto space-y-4">
        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}
        
        <div className="flex items-center justify-between bg-card/40 rounded-lg px-4 py-3">
          <span className="text-sm text-muted-foreground">
            This is the final section.
          </span>
          <Button
            onClick={handleSubmit}
            disabled={submitting || submitted || !response.trim()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : submitted ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Submitted!
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Assessment
              </>
            )}
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground text-center">
          Once submitted, you cannot make changes to your assessment.
        </p>
      </div>
    </div>
  );
};

export default SystemDesignSection;

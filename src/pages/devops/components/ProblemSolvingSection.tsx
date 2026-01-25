import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ArrowRight, Loader2, Clock } from 'lucide-react';
import type { ProblemSolvingConfig } from '@/lib/assessment-api';

interface ProblemSolvingSectionProps {
  config: ProblemSolvingConfig;
  onSubmit: (payload: Record<string, string>) => Promise<any>;
  initialAnswers?: Record<string, string>;
  onAnswersChange?: (answers: Record<string, string>) => void;
  submitting: boolean;
}

const ProblemSolvingSection = ({
  config,
  onSubmit,
  initialAnswers = {},
  onAnswersChange,
  submitting,
}: ProblemSolvingSectionProps) => {
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAnswers(initialAnswers);
  }, [initialAnswers]);

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => {
      const next = { ...prev, [questionId]: value };
      onAnswersChange?.(next);
      return next;
    });
  };

  const handleSubmit = async () => {
    // Validate all questions are answered
    const unanswered = config.questions.filter((q) => !answers[q.id]?.trim());
    if (unanswered.length > 0) {
      setError(`Please answer all questions before submitting. (${unanswered.length} remaining)`);
      return;
    }

    setError(null);
    try {
      await onSubmit(answers);
    } catch (err: any) {
      setError(err.message || 'Failed to submit. Please try again.');
    }
  };

  const answeredCount = Object.values(answers).filter((a) => a?.trim()).length;
  const totalCount = config.questions.length;

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

      {/* Questions */}
      <div className="space-y-6">
        {config.questions.map((question, index) => (
          <Card key={question.id} className="bg-card/60 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium text-white flex items-start gap-3">
                <span className="bg-primary/20 text-primary text-sm font-semibold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">
                  {index + 1}
                </span>
                <span>{question.questionText}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {question.type === 'mcq' && question.options ? (
                <RadioGroup
                  value={answers[question.id] || ''}
                  onValueChange={(value) => handleAnswerChange(question.id, value)}
                  className="space-y-3"
                >
                  {question.options.map((option) => (
                    <div key={option.id} className="flex items-start space-x-3">
                      <RadioGroupItem
                        value={option.id}
                        id={`${question.id}-${option.id}`}
                        className="mt-1"
                      />
                      <Label
                        htmlFor={`${question.id}-${option.id}`}
                        className="text-sm text-muted-foreground cursor-pointer leading-relaxed"
                      >
                        <span className="font-medium text-white mr-2">{option.id}.</span>
                        {option.text}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              ) : (
                <Textarea
                  placeholder="Type your answer here..."
                  value={answers[question.id] || ''}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  className="min-h-[80px] bg-background/50 border-border text-white placeholder:text-muted-foreground resize-none"
                />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Submit Section */}
      <div className="space-y-4">
        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}
        
        <div className="flex items-center justify-between bg-card/40 rounded-lg px-4 py-3">
          <span className="text-sm text-muted-foreground">
            {answeredCount} of {totalCount} questions answered
          </span>
          <Button
            onClick={handleSubmit}
            disabled={submitting || answeredCount < totalCount}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                Continue to Coding
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground text-center">
          You cannot change your answers after submitting this section.
        </p>
      </div>
    </div>
  );
};

export default ProblemSolvingSection;

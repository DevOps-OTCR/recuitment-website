import { recruitingStore } from '../store';
import { type Evaluation, type InterviewRound } from '../types';

const cloneEvaluation = (evaluation: Evaluation): Evaluation => ({
  ...evaluation,
  rubric: { ...evaluation.rubric },
  strengths: [...evaluation.strengths],
  concerns: [...evaluation.concerns],
});

// Evaluation reads/writes are async-shaped now so API persistence can replace the store later.
export const evaluationsService = {
  async listEvaluations(): Promise<Evaluation[]> {
    return recruitingStore.getSnapshot().evaluations.map(cloneEvaluation);
  },

  async listEvaluationsForApplicant(applicantId: string): Promise<Evaluation[]> {
    return recruitingStore
      .getSnapshot()
      .evaluations
      .filter((evaluation) => evaluation.applicantId === applicantId)
      .map(cloneEvaluation);
  },

  async getEvaluationForApplicantRoundInterviewer(
    applicantId: string,
    round: InterviewRound,
    interviewerId: string
  ): Promise<Evaluation | null> {
    const evaluation =
      recruitingStore
        .getSnapshot()
        .evaluations
        .find(
          (entry) =>
            entry.applicantId === applicantId &&
            entry.round === round &&
            entry.interviewerId === interviewerId
        ) ?? null;

    return evaluation ? cloneEvaluation(evaluation) : null;
  },

  async upsertEvaluation(evaluation: Evaluation): Promise<Evaluation> {
    recruitingStore.upsertEvaluation(evaluation);
    return cloneEvaluation(evaluation);
  },
};

import { recruitingStore } from '../store';
import { type Assignment, type InterviewRound } from '../types';

const cloneAssignment = (assignment: Assignment): Assignment => ({ ...assignment });

// Assignment commands stay here so pages do not mutate recruitingStore directly.
export const assignmentsService = {
  async listAssignments(): Promise<Assignment[]> {
    return recruitingStore.getSnapshot().assignments.map(cloneAssignment);
  },

  async listAssignmentsForApplicant(applicantId: string, round?: InterviewRound): Promise<Assignment[]> {
    return recruitingStore
      .getSnapshot()
      .assignments
      .filter((assignment) => assignment.applicantId === applicantId && (round ? assignment.round === round : true))
      .map(cloneAssignment);
  },

  async listAssignmentsForInterviewer(interviewerId: string): Promise<Assignment[]> {
    return recruitingStore
      .getSnapshot()
      .assignments
      .filter((assignment) => assignment.interviewerId === interviewerId)
      .map(cloneAssignment);
  },

  async upsertAssignment(assignment: Assignment): Promise<Assignment> {
    recruitingStore.upsertAssignment(assignment);
    return cloneAssignment(assignment);
  },
};

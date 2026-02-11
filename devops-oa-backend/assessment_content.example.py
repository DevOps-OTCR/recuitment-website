"""
Assessment content configuration - EXAMPLE FILE.

Copy this file to assessment_content.py and fill in your actual questions.
The real assessment_content.py is gitignored to keep questions private.

For production (Render), create assessment_content.py on the server with actual content.

Author: Adeetya Upadhyay <adeeu2@illinois.edu>
"""


def get_assessment_content() -> dict:
    """Get the full assessment content configuration."""
    return {
        "estimatedMinutes": 35,
        "timeLimitMinutes": 45,
        "sections": ["problem_solving", "coding", "system_design"],
        
        "problemSolving": {
            "title": "Problem Solving",
            "timeEstimate": "8-10 min",
            "instructions": "Answer the following questions.",
            "questions": [
                {
                    "id": "ps1",
                    "type": "mcq",
                    "questionText": "Sample question 1 - replace with actual content",
                    "options": [
                        {"id": "A", "text": "Option A"},
                        {"id": "B", "text": "Option B"},
                        {"id": "C", "text": "Option C"},
                        {"id": "D", "text": "Option D"},
                    ],
                },
                {
                    "id": "ps2",
                    "type": "short_answer",
                    "questionText": "Sample short answer question - replace with actual content",
                },
            ],
        },
        
        "coding": {
            "title": "Coding Challenge",
            "timeEstimate": "12-18 min",
            "instructions": "Solve the following problem in Python.",
            "problem": {
                "title": "Sample Problem",
                "description": "Replace with actual problem description.",
                "starterCode": "# Your code here\n",
            },
            "testCases": [
                {
                    "input": "sample input",
                    "expectedOutput": "sample output",
                },
            ],
            "hiddenTestCases": [
                {
                    "input": "hidden input",
                    "expectedOutput": "hidden output",
                },
            ],
        },
        
        "systemDesign": {
            "title": "System Design",
            "timeEstimate": "10-15 min",
            "instructions": "Answer the design question below.",
            "prompt": "Replace with actual system design prompt.",
        },
    }


def get_mcq_answer_key() -> dict:
    """MCQ answer key for scoring: { question_id: { questionText, correctAnswer } }. Empty if not configured."""
    return {}

import { CheckCircle, Circle } from 'lucide-react';

interface ProgressIndicatorProps {
  sections: string[];
  currentSection: string;
  completedSections: string[];
}

const SECTION_LABELS: Record<string, string> = {
  problem_solving: 'Problem Solving',
  coding: 'Coding',
  system_design: 'System Design',
};

const ProgressIndicator = ({
  sections,
  currentSection,
  completedSections,
}: ProgressIndicatorProps) => {
  const currentIndex = sections.indexOf(currentSection);

  return (
    <div className="w-full">
      {/* Mobile: Simple step indicator */}
      <div className="flex flex-col items-center justify-center gap-2 md:hidden">
        <span className="text-sm font-medium text-white">
          {currentIndex + 1} / {sections.length}
        </span>
        <span className="text-sm text-white font-semibold">
          {SECTION_LABELS[currentSection]}
        </span>
      </div>

      {/* Desktop: Full progress bar */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {sections.map((section, index) => {
            const isCompleted = completedSections.includes(section);
            const isCurrent = section === currentSection;
            const isPast = index < currentIndex;

            return (
              <div key={section} className="flex items-center flex-1">
                {/* Step indicator */}
                <div className="flex flex-col items-center">
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center
                      transition-all duration-300
                      ${isCompleted
                        ? 'bg-green-500/20 text-green-500'
                        : isCurrent
                          ? 'bg-primary/20 text-primary ring-2 ring-primary/50'
                          : 'bg-muted text-muted-foreground'
                      }
                    `}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-semibold">{index + 1}</span>
                    )}
                  </div>
                  <span
                    className={`
                      mt-2 text-xs font-medium whitespace-nowrap
                      ${isCurrent ? 'text-white' : 'text-muted-foreground'}
                    `}
                  >
                    {SECTION_LABELS[section]}
                  </span>
                </div>

                {/* Connector line */}
                {index < sections.length - 1 && (
                  <div className="flex-1 mx-4">
                    <div
                      className={`
                        h-0.5 w-full transition-all duration-300
                        ${isPast || isCompleted
                          ? 'bg-green-500/50'
                          : 'bg-border'
                        }
                      `}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProgressIndicator;

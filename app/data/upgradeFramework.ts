// Upgrade Science Framework - 5 Main Steps x 5 Sub-Steps = 25 Total Steps

export type SubStepType = 'goal' | 'definition' | 'questions' | 'inputs' | 'output';

export interface SubStep {
  id: string;
  type: SubStepType;
  title: string;
  content: string;
  bullets?: string[];
  checklistItems?: { id: string; label: string; completed: boolean }[];
}

export interface MainStep {
  id: string;
  name: string;
  shortName: string;
  order: number;
  icon: string;
  color: string;
  description: string;
  subSteps: SubStep[];
}

export const MAIN_STEPS: MainStep[] = [
  {
    id: 'baseline',
    name: 'Baseline',
    shortName: 'Baseline',
    order: 1,
    icon: 'scan',
    color: '#FF5C00',
    description: 'Establish your current state as a clear, measurable reference point',
    subSteps: [
      {
        id: 'baseline-goal',
        type: 'goal',
        title: 'Goal',
        content: 'Establish the current state as a clear, measurable reference point before any changes are made. This baseline serves as the foundation for tracking progress and measuring success.',
        bullets: [
          'Create a snapshot of current performance metrics',
          'Document existing processes and workflows',
          'Identify key stakeholders and their perspectives'
        ],
        checklistItems: [
          { id: 'b1', label: 'Document current metrics', completed: false },
          { id: 'b2', label: 'Identify key stakeholders', completed: false },
          { id: 'b3', label: 'Set measurement timeline', completed: false }
        ]
      },
      {
        id: 'baseline-definition',
        type: 'definition',
        title: 'Definition',
        content: 'Success criteria for establishing a proper baseline include having quantifiable metrics, documented processes, and stakeholder alignment on the current state assessment.',
        bullets: [
          'Quantifiable metrics with clear measurement methods',
          'Documented current-state processes',
          'Stakeholder sign-off on baseline assessment'
        ]
      },
      {
        id: 'baseline-questions',
        type: 'questions',
        title: 'Key Questions',
        content: 'Critical questions to answer when establishing your baseline:',
        bullets: [
          'What metrics best represent our current performance?',
          'Who are the key stakeholders affected by this upgrade?',
          'What is our measurement timeframe?',
          'Are there any blind spots in our current assessment?'
        ]
      },
      {
        id: 'baseline-inputs',
        type: 'inputs',
        title: 'Inputs',
        content: 'Required inputs for establishing an accurate baseline:',
        bullets: [
          'Historical performance data',
          'Current process documentation',
          'Stakeholder interviews and feedback',
          'Industry benchmarks for comparison'
        ]
      },
      {
        id: 'baseline-output',
        type: 'output',
        title: 'Mechanisms & Output',
        content: 'The baseline phase produces a comprehensive current-state document that serves as the reference point for all future measurements and decisions.',
        bullets: [
          'Baseline assessment report',
          'Key performance indicator (KPI) dashboard',
          'Stakeholder alignment document',
          'Measurement framework and timeline'
        ]
      }
    ]
  },
  {
    id: 'desired',
    name: 'Desired State',
    shortName: 'Desired',
    order: 2,
    icon: 'target',
    color: '#22C55E',
    description: 'Define your target outcome with clarity and measurable criteria',
    subSteps: [
      {
        id: 'desired-goal',
        type: 'goal',
        title: 'Goal',
        content: 'Articulate a clear, compelling vision of the future state that addresses the identified gaps and creates meaningful value for all stakeholders.',
        bullets: [
          'Define specific, measurable outcomes',
          'Align vision with organizational strategy',
          'Create emotional connection to the end goal'
        ],
        checklistItems: [
          { id: 'd1', label: 'Define target metrics', completed: false },
          { id: 'd2', label: 'Validate with stakeholders', completed: false },
          { id: 'd3', label: 'Document success criteria', completed: false }
        ]
      },
      {
        id: 'desired-definition',
        type: 'definition',
        title: 'Definition',
        content: 'A well-defined desired state is specific, measurable, achievable, relevant, and time-bound (SMART), with clear indicators of success.',
        bullets: [
          'Specific outcomes with quantifiable targets',
          'Realistic timeline for achievement',
          'Clear value proposition for stakeholders'
        ]
      },
      {
        id: 'desired-questions',
        type: 'questions',
        title: 'Key Questions',
        content: 'Questions to clarify your desired state:',
        bullets: [
          'What does success look like in measurable terms?',
          'How will stakeholders benefit from this change?',
          'What constraints must we work within?',
          'How ambitious should our targets be?'
        ]
      },
      {
        id: 'desired-inputs',
        type: 'inputs',
        title: 'Inputs',
        content: 'Required inputs for defining the desired state:',
        bullets: [
          'Baseline assessment findings',
          'Strategic objectives and priorities',
          'Stakeholder aspirations and concerns',
          'Resource availability and constraints'
        ]
      },
      {
        id: 'desired-output',
        type: 'output',
        title: 'Mechanisms & Output',
        content: 'The desired state phase produces a clear vision document with measurable success criteria and stakeholder buy-in.',
        bullets: [
          'Vision statement and success metrics',
          'Gap analysis (baseline vs. desired)',
          'Stakeholder value proposition',
          'Timeline and milestone markers'
        ]
      }
    ]
  },
  {
    id: 'explore',
    name: 'Explore Options',
    shortName: 'Explore',
    order: 3,
    icon: 'compass',
    color: '#3B82F6',
    description: 'Generate and evaluate multiple pathways to reach your desired state',
    subSteps: [
      {
        id: 'explore-goal',
        type: 'goal',
        title: 'Goal',
        content: 'Generate a diverse set of potential solutions and pathways, then systematically evaluate them against criteria to identify the most promising approaches.',
        bullets: [
          'Brainstorm multiple solution approaches',
          'Evaluate options against clear criteria',
          'Identify trade-offs and dependencies'
        ],
        checklistItems: [
          { id: 'e1', label: 'Generate option list', completed: false },
          { id: 'e2', label: 'Define evaluation criteria', completed: false },
          { id: 'e3', label: 'Score and rank options', completed: false }
        ]
      },
      {
        id: 'explore-definition',
        type: 'definition',
        title: 'Definition',
        content: 'Effective exploration means considering multiple viable paths without premature commitment, while maintaining focus on the desired outcome.',
        bullets: [
          'Minimum 3-5 distinct options considered',
          'Clear evaluation criteria applied consistently',
          'Documented pros, cons, and trade-offs'
        ]
      },
      {
        id: 'explore-questions',
        type: 'questions',
        title: 'Key Questions',
        content: 'Questions to guide option exploration:',
        bullets: [
          'What are all possible ways to close the gap?',
          'What are the risks and benefits of each approach?',
          'Which options can be combined or sequenced?',
          'What would we do with unlimited resources?'
        ]
      },
      {
        id: 'explore-inputs',
        type: 'inputs',
        title: 'Inputs',
        content: 'Required inputs for exploring options:',
        bullets: [
          'Gap analysis from desired state phase',
          'Resource inventory and constraints',
          'Industry best practices and case studies',
          'Team expertise and capabilities'
        ]
      },
      {
        id: 'explore-output',
        type: 'output',
        title: 'Mechanisms & Output',
        content: 'The exploration phase produces a prioritized list of options with clear evaluation rationale and recommended path forward.',
        bullets: [
          'Options matrix with evaluation scores',
          'Trade-off analysis for top options',
          'Resource requirements for each option',
          'Preliminary recommendation with rationale'
        ]
      }
    ]
  },
  {
    id: 'decision',
    name: 'Decision',
    shortName: 'Decision',
    order: 4,
    icon: 'scale',
    color: '#A855F7',
    description: 'Commit to a specific approach with clear rationale and stakeholder alignment',
    subSteps: [
      {
        id: 'decision-goal',
        type: 'goal',
        title: 'Goal',
        content: 'Make a clear, confident decision on the approach to pursue, with documented rationale and stakeholder commitment.',
        bullets: [
          'Select the optimal path forward',
          'Secure stakeholder commitment',
          'Document decision rationale for future reference'
        ],
        checklistItems: [
          { id: 'dc1', label: 'Make final selection', completed: false },
          { id: 'dc2', label: 'Get stakeholder sign-off', completed: false },
          { id: 'dc3', label: 'Document rationale', completed: false }
        ]
      },
      {
        id: 'decision-definition',
        type: 'definition',
        title: 'Definition',
        content: 'A good decision is one that is clearly communicated, well-reasoned, and has the commitment of key stakeholders to execute.',
        bullets: [
          'Clear selection with documented reasoning',
          'Stakeholder alignment and commitment',
          'Defined success metrics and checkpoints'
        ]
      },
      {
        id: 'decision-questions',
        type: 'questions',
        title: 'Key Questions',
        content: 'Questions to ensure decision quality:',
        bullets: [
          'Is this decision reversible or irreversible?',
          'Do we have the information we need to decide?',
          'Who needs to commit for this to succeed?',
          'What would make us reconsider this decision?'
        ]
      },
      {
        id: 'decision-inputs',
        type: 'inputs',
        title: 'Inputs',
        content: 'Required inputs for decision-making:',
        bullets: [
          'Options analysis and recommendations',
          'Stakeholder feedback and concerns',
          'Risk assessment for top options',
          'Resource commitment availability'
        ]
      },
      {
        id: 'decision-output',
        type: 'output',
        title: 'Mechanisms & Output',
        content: 'The decision phase produces a formal commitment document with clear accountability and success criteria.',
        bullets: [
          'Decision document with rationale',
          'Stakeholder commitment signatures',
          'Success criteria and checkpoints',
          'Contingency plans for key risks'
        ]
      }
    ]
  },
  {
    id: 'implement',
    name: 'Implementation',
    shortName: 'Implement',
    order: 5,
    icon: 'rocket',
    color: '#F59E0B',
    description: 'Execute the chosen approach with disciplined tracking and adaptation',
    subSteps: [
      {
        id: 'implement-goal',
        type: 'goal',
        title: 'Goal',
        content: 'Execute the chosen approach effectively, tracking progress against milestones and adapting as needed while maintaining focus on the desired outcome.',
        bullets: [
          'Execute with discipline and focus',
          'Track progress against clear milestones',
          'Adapt to learnings while maintaining direction'
        ],
        checklistItems: [
          { id: 'i1', label: 'Create implementation plan', completed: false },
          { id: 'i2', label: 'Assign responsibilities', completed: false },
          { id: 'i3', label: 'Set up tracking system', completed: false }
        ]
      },
      {
        id: 'implement-definition',
        type: 'definition',
        title: 'Definition',
        content: 'Successful implementation means achieving the desired state metrics while building organizational capability and learning.',
        bullets: [
          'Milestones achieved on schedule',
          'Metrics trending toward desired state',
          'Team capability and confidence growing'
        ]
      },
      {
        id: 'implement-questions',
        type: 'questions',
        title: 'Key Questions',
        content: 'Questions to guide implementation:',
        bullets: [
          'Are we on track toward our milestones?',
          'What obstacles are we encountering?',
          'What are we learning that should inform our approach?',
          'Do we need to adjust our plan?'
        ]
      },
      {
        id: 'implement-inputs',
        type: 'inputs',
        title: 'Inputs',
        content: 'Required inputs for implementation:',
        bullets: [
          'Decision document and commitments',
          'Detailed project plan and timeline',
          'Resource allocation and assignments',
          'Communication and change management plan'
        ]
      },
      {
        id: 'implement-output',
        type: 'output',
        title: 'Mechanisms & Output',
        content: 'The implementation phase produces measurable progress toward the desired state with documented learnings.',
        bullets: [
          'Progress reports against milestones',
          'Updated metrics showing improvement',
          'Lessons learned documentation',
          'Recommendations for future upgrades'
        ]
      }
    ]
  }
];

// Connection labels between main steps (like in the inspiration images)
export const STEP_CONNECTIONS = [
  { from: 'baseline', to: 'desired', label: 'defines gap' },
  { from: 'desired', to: 'explore', label: 'guides search' },
  { from: 'explore', to: 'decision', label: 'informs choice' },
  { from: 'decision', to: 'implement', label: 'enables action' },
  { from: 'implement', to: 'baseline', label: 'updates state' }
];

// Helper functions
export function getMainStepById(id: string): MainStep | undefined {
  return MAIN_STEPS.find(step => step.id === id);
}

export function getSubStepById(mainStepId: string, subStepId: string): SubStep | undefined {
  const mainStep = getMainStepById(mainStepId);
  return mainStep?.subSteps.find(sub => sub.id === subStepId);
}

export function getStepNumber(mainStepId: string, subStepType?: SubStepType): number {
  const mainStep = MAIN_STEPS.find(s => s.id === mainStepId);
  if (!mainStep) return 0;

  const baseNumber = (mainStep.order - 1) * 5;
  if (!subStepType) return baseNumber + 1;

  const subStepIndex = mainStep.subSteps.findIndex(s => s.type === subStepType);
  return baseNumber + subStepIndex + 1;
}

export function getTotalSteps(): number {
  return MAIN_STEPS.length * 5; // 25 total
}

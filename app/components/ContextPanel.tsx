'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flag, CheckSquare, HelpCircle, Inbox, Workflow,
  ChevronLeft, ChevronRight, X, Check
} from 'lucide-react';
import { MainStep, SubStep, SubStepType, getStepNumber, getTotalSteps } from '../data/upgradeFramework';

interface ContextPanelProps {
  mainStep: MainStep | null;
  selectedSubStepType: SubStepType;
  onSubStepChange: (type: SubStepType) => void;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
  checklistProgress: Record<string, boolean>;
  onChecklistToggle: (itemId: string) => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
}

const TAB_ICONS: Record<SubStepType, React.ComponentType<{ size?: number; className?: string }>> = {
  goal: Flag,
  definition: CheckSquare,
  questions: HelpCircle,
  inputs: Inbox,
  output: Workflow,
};

const TAB_LABELS: Record<SubStepType, string> = {
  goal: 'Goal',
  definition: 'Definition',
  questions: 'Questions',
  inputs: 'Inputs',
  output: 'Output',
};

const SUB_STEP_ORDER: SubStepType[] = ['goal', 'definition', 'questions', 'inputs', 'output'];

export default function ContextPanel({
  mainStep,
  selectedSubStepType,
  onSubStepChange,
  onClose,
  onPrevious,
  onNext,
  checklistProgress,
  onChecklistToggle,
  canGoPrevious,
  canGoNext,
}: ContextPanelProps) {
  if (!mainStep) return null;

  const selectedSubStep = mainStep.subSteps.find(s => s.type === selectedSubStepType);
  const currentStepNumber = getStepNumber(mainStep.id, selectedSubStepType);
  const totalSteps = getTotalSteps();

  // Calculate step progress
  const completedCount = mainStep.subSteps.filter((_, i) =>
    SUB_STEP_ORDER.indexOf(selectedSubStepType) > i
  ).length;
  const progressPercent = (completedCount / 5) * 100;

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="w-full h-full flex flex-col bg-[#0a0a0b]/90 backdrop-blur-xl border-l border-white/10"
    >
      {/* Panel Header */}
      <div className="flex-shrink-0 p-6 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: mainStep.color + '22', borderColor: mainStep.color }}
            >
              <span className="text-lg" style={{ color: mainStep.color }}>
                {mainStep.order}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">{mainStep.name}</h2>
              <p className="text-sm text-[#666]">Step {mainStep.order} of 5</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={20} className="text-[#666]" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-[#666] mb-1">
            <span>Step Progress</span>
            <span style={{ color: mainStep.color }}>{currentStepNumber} / {totalSteps}</span>
          </div>
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: mainStep.color }}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 p-1 bg-white/5 rounded-lg">
          {SUB_STEP_ORDER.map((type) => {
            const Icon = TAB_ICONS[type];
            const isSelected = selectedSubStepType === type;

            return (
              <button
                key={type}
                onClick={() => onSubStepChange(type)}
                className={`
                  flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-md
                  text-xs font-medium transition-all duration-200
                  ${isSelected
                    ? 'text-white'
                    : 'text-[#666] hover:text-[#999] hover:bg-white/5'
                  }
                `}
                style={isSelected ? { backgroundColor: mainStep.color + '33', color: mainStep.color } : {}}
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{TAB_LABELS[type]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          {selectedSubStep && (
            <motion.div
              key={selectedSubStep.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Content Title */}
              <h3 className="text-lg font-semibold text-white mb-3">
                {selectedSubStep.title}
              </h3>

              {/* Main Content */}
              <p className="text-[#999] leading-relaxed mb-6">
                {selectedSubStep.content}
              </p>

              {/* Why This Matters Section */}
              {selectedSubStep.type === 'goal' && (
                <div className="mb-6 p-4 rounded-lg bg-white/5 border border-white/10">
                  <h4 className="text-sm font-semibold text-white mb-2">
                    Why This Matters
                  </h4>
                  <p className="text-sm text-[#888]">
                    Without a clear {mainStep.name.toLowerCase()}, you cannot measure progress or know if
                    your upgrade efforts are working. The {mainStep.name.toLowerCase()} provides objective
                    criteria for success.
                  </p>
                </div>
              )}

              {/* Bullets */}
              {selectedSubStep.bullets && selectedSubStep.bullets.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-white mb-3">
                    Key Points
                  </h4>
                  <ul className="space-y-2">
                    {selectedSubStep.bullets.map((bullet, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start gap-3 text-sm text-[#999]"
                      >
                        <span
                          className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: mainStep.color }}
                        />
                        {bullet}
                      </motion.li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Checklist */}
              {selectedSubStep.checklistItems && selectedSubStep.checklistItems.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-white mb-3">
                    Checklist
                  </h4>
                  <div className="space-y-2">
                    {selectedSubStep.checklistItems.map((item) => {
                      const isCompleted = checklistProgress[item.id] || false;

                      return (
                        <button
                          key={item.id}
                          onClick={() => onChecklistToggle(item.id)}
                          className={`
                            w-full flex items-center gap-3 p-3 rounded-lg
                            border transition-all duration-200 text-left
                            ${isCompleted
                              ? 'bg-white/5 border-white/20'
                              : 'bg-transparent border-white/10 hover:border-white/20'
                            }
                          `}
                        >
                          <div
                            className={`
                              w-5 h-5 rounded flex items-center justify-center flex-shrink-0
                              border-2 transition-all duration-200
                            `}
                            style={{
                              borderColor: isCompleted ? mainStep.color : '#444',
                              backgroundColor: isCompleted ? mainStep.color : 'transparent',
                            }}
                          >
                            {isCompleted && <Check size={12} className="text-white" />}
                          </div>
                          <span
                            className={`text-sm ${isCompleted ? 'text-[#666] line-through' : 'text-[#ccc]'}`}
                          >
                            {item.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation Footer */}
      <div className="flex-shrink-0 p-4 border-t border-white/10">
        <div className="flex items-center justify-between">
          <button
            onClick={onPrevious}
            disabled={!canGoPrevious}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg
              text-sm font-medium transition-all duration-200
              ${canGoPrevious
                ? 'text-[#999] hover:text-white hover:bg-white/10'
                : 'text-[#444] cursor-not-allowed'
              }
            `}
          >
            <ChevronLeft size={18} />
            Previous
          </button>

          <button
            onClick={onNext}
            disabled={!canGoNext}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg
              text-sm font-medium transition-all duration-200
            `}
            style={{
              backgroundColor: canGoNext ? mainStep.color : '#333',
              color: canGoNext ? 'white' : '#666',
            }}
          >
            Next Step
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

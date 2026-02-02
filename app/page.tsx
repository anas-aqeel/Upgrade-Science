'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, RotateCcw, ZoomIn, ZoomOut, Menu, X } from 'lucide-react';
import ForceGraph from './components/ForceGraph';
import ContextPanel from './components/ContextPanel';
import { MAIN_STEPS, SubStepType, getMainStepById, getStepNumber, getTotalSteps } from './data/upgradeFramework';
import { useLocalStorage, UpgradeProgress, DEFAULT_PROGRESS } from './hooks/useLocalStorage';

export default function Home() {
  // State
  const [progress, setProgress] = useLocalStorage<UpgradeProgress>('upgrade-progress', DEFAULT_PROGRESS);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [resetViewTrigger, setResetViewTrigger] = useState(0);
  const [zoomInTrigger, setZoomInTrigger] = useState(0);
  const [zoomOutTrigger, setZoomOutTrigger] = useState(0);

  // Derived state
  const selectedMainStep = progress.currentMainStep;
  const selectedSubStepType = progress.currentSubStep.split('-').pop() as SubStepType || 'goal';
  const expandedSteps = progress.expandedMainSteps;
  const currentMainStepData = getMainStepById(selectedMainStep);

  // Completed steps (for visual indicator)
  const completedSteps = new Set<string>(
    progress.steps.filter(s => s.completed).map(s => s.subStepId)
  );

  // Checklist progress for current step
  const currentChecklistProgress = progress.steps.find(
    s => s.mainStepId === selectedMainStep && s.subStepId === `${selectedMainStep}-${selectedSubStepType}`
  )?.checklistProgress || {};

  // Handlers
  const handleMainStepClick = useCallback((stepId: string) => {
    setProgress(prev => {
      const isExpanded = prev.expandedMainSteps.includes(stepId);
      // Only allow one expanded step at a time - toggle off if clicking same, otherwise switch
      const newExpanded = isExpanded ? [] : [stepId];

      return {
        ...prev,
        currentMainStep: stepId,
        currentSubStep: `${stepId}-goal`,
        expandedMainSteps: newExpanded,
        lastUpdated: new Date().toISOString()
      };
    });
    setIsPanelOpen(true);
  }, [setProgress]);

  const handleSubStepClick = useCallback((mainStepId: string, subStepId: string) => {
    setProgress(prev => ({
      ...prev,
      currentMainStep: mainStepId,
      currentSubStep: subStepId,
      lastUpdated: new Date().toISOString()
    }));
    setIsPanelOpen(true);
  }, [setProgress]);

  const handleSubStepChange = useCallback((type: SubStepType) => {
    setProgress(prev => ({
      ...prev,
      currentSubStep: `${prev.currentMainStep}-${type}`,
      lastUpdated: new Date().toISOString()
    }));
  }, [setProgress]);

  const handleChecklistToggle = useCallback((itemId: string) => {
    setProgress(prev => {
      const currentSubStepId = `${prev.currentMainStep}-${selectedSubStepType}`;
      const existingStep = prev.steps.find(
        s => s.mainStepId === prev.currentMainStep && s.subStepId === currentSubStepId
      );

      const newChecklistProgress = {
        ...(existingStep?.checklistProgress || {}),
        [itemId]: !(existingStep?.checklistProgress?.[itemId] || false)
      };

      const updatedSteps = existingStep
        ? prev.steps.map(s =>
            s.mainStepId === prev.currentMainStep && s.subStepId === currentSubStepId
              ? { ...s, checklistProgress: newChecklistProgress }
              : s
          )
        : [
            ...prev.steps,
            {
              mainStepId: prev.currentMainStep,
              subStepId: currentSubStepId,
              completed: false,
              checklistProgress: newChecklistProgress
            }
          ];

      return {
        ...prev,
        steps: updatedSteps,
        lastUpdated: new Date().toISOString()
      };
    });
  }, [setProgress, selectedSubStepType]);

  const handlePrevious = useCallback(() => {
    const SUB_STEP_ORDER: SubStepType[] = ['goal', 'definition', 'questions', 'inputs', 'output'];
    const currentSubIndex = SUB_STEP_ORDER.indexOf(selectedSubStepType);
    const currentMainIndex = MAIN_STEPS.findIndex(s => s.id === selectedMainStep);

    if (currentSubIndex > 0) {
      // Go to previous sub-step
      handleSubStepChange(SUB_STEP_ORDER[currentSubIndex - 1]);
    } else if (currentMainIndex > 0) {
      // Go to last sub-step of previous main step
      const prevMainStep = MAIN_STEPS[currentMainIndex - 1];
      setProgress(prev => ({
        ...prev,
        currentMainStep: prevMainStep.id,
        currentSubStep: `${prevMainStep.id}-output`,
        // Single expand: only expand the new step, collapse others
        expandedMainSteps: [prevMainStep.id],
        lastUpdated: new Date().toISOString()
      }));
    }
  }, [selectedMainStep, selectedSubStepType, handleSubStepChange, setProgress]);

  const handleNext = useCallback(() => {
    const SUB_STEP_ORDER: SubStepType[] = ['goal', 'definition', 'questions', 'inputs', 'output'];
    const currentSubIndex = SUB_STEP_ORDER.indexOf(selectedSubStepType);
    const currentMainIndex = MAIN_STEPS.findIndex(s => s.id === selectedMainStep);

    if (currentSubIndex < SUB_STEP_ORDER.length - 1) {
      // Go to next sub-step
      handleSubStepChange(SUB_STEP_ORDER[currentSubIndex + 1]);
    } else if (currentMainIndex < MAIN_STEPS.length - 1) {
      // Go to first sub-step of next main step
      const nextMainStep = MAIN_STEPS[currentMainIndex + 1];
      setProgress(prev => ({
        ...prev,
        currentMainStep: nextMainStep.id,
        currentSubStep: `${nextMainStep.id}-goal`,
        // Single expand: only expand the new step, collapse others
        expandedMainSteps: [nextMainStep.id],
        lastUpdated: new Date().toISOString()
      }));
    }
  }, [selectedMainStep, selectedSubStepType, handleSubStepChange, setProgress]);

  const handleResetView = useCallback(() => {
    setResetViewTrigger(prev => prev + 1);
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoomInTrigger(prev => prev + 1);
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomOutTrigger(prev => prev + 1);
  }, []);

  // Calculate navigation state
  const SUB_STEP_ORDER: SubStepType[] = ['goal', 'definition', 'questions', 'inputs', 'output'];
  const currentSubIndex = SUB_STEP_ORDER.indexOf(selectedSubStepType);
  const currentMainIndex = MAIN_STEPS.findIndex(s => s.id === selectedMainStep);
  const canGoPrevious = currentMainIndex > 0 || currentSubIndex > 0;
  const canGoNext = currentMainIndex < MAIN_STEPS.length - 1 || currentSubIndex < SUB_STEP_ORDER.length - 1;

  // Overall progress
  const currentStepNumber = getStepNumber(selectedMainStep, selectedSubStepType);
  const totalSteps = getTotalSteps();
  const overallProgress = (currentStepNumber / totalSteps) * 100;

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0a0a0b] overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 h-14 border-b border-white/10 px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#FF5C00] flex items-center justify-center">
              <Zap size={18} className="text-white" />
            </div>
            <span className="font-semibold text-white">UPGRADE</span>
          </div>

          {/* Breadcrumb */}
          <div className="hidden sm:flex items-center gap-2 text-sm">
            <span className="text-[#666]">/</span>
            <span
              className="font-medium"
              style={{ color: currentMainStepData?.color || '#FF5C00' }}
            >
              {currentMainStepData?.name || 'Baseline'}
            </span>
            <span className="text-[#666]">/</span>
            <span className="text-[#999] capitalize">{selectedSubStepType}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Progress Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
            <span className="text-xs text-[#666]">Progress:</span>
            <span className="text-sm font-medium text-white">
              {currentStepNumber} / {totalSteps}
            </span>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="sm:hidden p-2 rounded-lg hover:bg-white/10"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Graph Area */}
        <div
          className={`
            flex-1 relative transition-all duration-300
            ${isPanelOpen ? 'sm:w-[60%]' : 'w-full'}
          `}
        >
          {/* Center Glow */}
          <div
            className="center-glow absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{
              background: `radial-gradient(circle, ${currentMainStepData?.color || '#FF5C00'}20 0%, transparent 70%)`
            }}
          />

          {/* Force Graph */}
          <ForceGraph
            selectedMainStep={selectedMainStep}
            selectedSubStep={`${selectedMainStep}-${selectedSubStepType}`}
            expandedSteps={expandedSteps}
            onMainStepClick={handleMainStepClick}
            onSubStepClick={handleSubStepClick}
            completedSteps={completedSteps}
            resetViewTrigger={resetViewTrigger}
            zoomInTrigger={zoomInTrigger}
            zoomOutTrigger={zoomOutTrigger}
          />

          {/* Graph Controls */}
          <div className="absolute bottom-4 right-4 flex items-center gap-2">
            <button
              onClick={handleResetView}
              className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              title="Reset View"
            >
              <RotateCcw size={18} className="text-[#666]" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut size={18} className="text-[#666]" />
            </button>
            <button
              onClick={handleZoomIn}
              className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              title="Zoom In"
            >
              <ZoomIn size={18} className="text-[#666]" />
            </button>
          </div>
        </div>

        {/* Context Panel */}
        <AnimatePresence>
          {isPanelOpen && currentMainStepData && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '40%' }}
              exit={{ width: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="hidden sm:block h-full overflow-hidden"
              style={{ minWidth: isPanelOpen ? '320px' : 0, maxWidth: '480px' }}
            >
              <ContextPanel
                mainStep={currentMainStepData}
                selectedSubStepType={selectedSubStepType}
                onSubStepChange={handleSubStepChange}
                onClose={() => setIsPanelOpen(false)}
                onPrevious={handlePrevious}
                onNext={handleNext}
                checklistProgress={currentChecklistProgress}
                onChecklistToggle={handleChecklistToggle}
                canGoPrevious={canGoPrevious}
                canGoNext={canGoNext}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Panel (Bottom Sheet) */}
        <AnimatePresence>
          {isMobileMenuOpen && currentMainStepData && (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="sm:hidden fixed inset-x-0 bottom-0 h-[80vh] z-50"
            >
              <ContextPanel
                mainStep={currentMainStepData}
                selectedSubStepType={selectedSubStepType}
                onSubStepChange={handleSubStepChange}
                onClose={() => setIsMobileMenuOpen(false)}
                onPrevious={handlePrevious}
                onNext={handleNext}
                checklistProgress={currentChecklistProgress}
                onChecklistToggle={handleChecklistToggle}
                canGoPrevious={canGoPrevious}
                canGoNext={canGoNext}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Progress Bar */}
      <footer className="flex-shrink-0 h-10 border-t border-white/10 px-4 flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <span className="text-xs text-[#666]">Overall Progress</span>
          <div className="flex-1 max-w-md h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: currentMainStepData?.color || '#FF5C00' }}
              initial={{ width: 0 }}
              animate={{ width: `${overallProgress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <span className="text-xs text-[#999]">{Math.round(overallProgress)}% Complete</span>
        </div>

        {/* Toggle Panel Button (Desktop) */}
        <button
          onClick={() => setIsPanelOpen(!isPanelOpen)}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors text-sm text-[#666]"
        >
          {isPanelOpen ? 'Hide Panel' : 'Show Panel'}
        </button>
      </footer>
    </div>
  );
}

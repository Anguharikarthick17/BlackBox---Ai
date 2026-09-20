import React, { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Landing } from './pages/Landing';
import { Workspace } from './pages/Workspace';
import { ErrorBoundary } from './components/common/ErrorBoundary';

type AppView = 'landing' | 'workspace';

export default function App() {
  const [view, setView] = useState<AppView>('landing');
  const [initialSection, setInitialSection] = useState<string>('observatory');

  const handleEnterWorkspace = useCallback((section?: string) => {
    setInitialSection(section ?? 'observatory');
    if (window.location.hash) {
      try {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      } catch (_) {}
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
    setView('workspace');
  }, []);

  const handleBack = useCallback(() => {
    if (window.location.hash) {
      try {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      } catch (_) {}
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
    setView('landing');
  }, []);

  return (
    <ErrorBoundary>
      <AnimatePresence mode="wait">
        {view === 'landing' ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Landing onEnterWorkspace={handleEnterWorkspace} />
          </motion.div>
        ) : (
          <motion.div
            key="workspace"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Workspace initialSection={initialSection} onBack={handleBack} />
          </motion.div>
        )}
      </AnimatePresence>
    </ErrorBoundary>
  );
}

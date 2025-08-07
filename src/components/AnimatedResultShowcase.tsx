import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, XCircle, Terminal, Image, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface ShowcaseExecutionResult {
  id: string;
  language: string;
  code: string;
  success: boolean;
  output?: string;
  error?: string;
  logs: string[];
  artifacts?: Array<{ name: string; url: string; type: 'image' | 'file' | 'chart' }>;
}

interface AnimatedResultShowcaseProps {
  visible: boolean;
  onClose: () => void;
  executions: ShowcaseExecutionResult[];
}

const AnimatedResultShowcase: React.FC<AnimatedResultShowcaseProps> = ({ visible, onClose, executions }) => {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50"
        >
          {/* Gradient background to match home page style */}
          <div className="absolute inset-0 -z-10 bg-[#0A0A0A]" />
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0"
          >
            <div 
              className="absolute left-0 top-0 w-full h-full rounded-full"
              style={{
                background: '#377AFB',
                opacity: 0.12,
                boxShadow: '300px 300px 300px',
                filter: 'blur(150px)'
              }}
            />
          </motion.div>

          {/* Content */}
          <div className="h-full w-full flex flex-col">
            <div className="p-4 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Execution Results</div>
              <Button size="sm" variant="outline" onClick={onClose} className="gap-2">
                <X className="w-3 h-3" />
                Close
              </Button>
            </div>

            <ScrollArea className="flex-1">
              <div className="container mx-auto px-4 pb-10">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="grid grid-cols-1 xl:grid-cols-2 gap-6"
                >
                  {executions.map((ex, index) => (
                    <motion.div
                      key={ex.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border rounded-xl bg-card/70 backdrop-blur-sm overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {ex.success ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                          <div className="text-sm font-medium">{ex.language} execution</div>
                        </div>
                        <div className="text-xs text-muted-foreground">Code lines: {ex.code.split('\n').length}</div>
                      </div>

                      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-[#0E0E0E] rounded-lg p-3">
                          <div className="text-xs text-muted-foreground mb-2">Code</div>
                          <pre className="text-[12px] leading-relaxed text-gray-300 whitespace-pre-wrap">{ex.code}</pre>
                        </div>
                        <div className="space-y-3">
                          <div className="bg-muted/40 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                              <Terminal className="w-3 h-3" />
                              Output
                            </div>
                            <pre className="text-[12px] whitespace-pre-wrap">{ex.output || 'No output'}</pre>
                          </div>
                          {ex.error && (
                            <div className="bg-red-950/40 rounded-lg p-3">
                              <div className="text-xs text-red-300 mb-1">Error</div>
                              <pre className="text-[12px] whitespace-pre-wrap text-red-300">{ex.error}</pre>
                            </div>
                          )}
                          {ex.logs && ex.logs.length > 0 && (
                            <div className="bg-muted/30 rounded-lg p-3">
                              <div className="text-xs text-muted-foreground mb-1">Logs</div>
                              <div className="space-y-1">
                                {ex.logs.slice(0, 8).map((l, i) => (
                                  <div key={i} className="text-[12px] text-muted-foreground">{l}</div>
                                ))}
                              </div>
                            </div>
                          )}
                          {ex.artifacts && ex.artifacts.length > 0 && (
                            <div className="bg-muted/30 rounded-lg p-3">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                                <Image className="w-3 h-3" />
                                Artifacts
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                {ex.artifacts.map((a, i) => (
                                  <a key={i} href={a.url} target="_blank" rel="noreferrer" className="group border rounded-md p-2 hover:bg-muted/40 flex items-center gap-2">
                                    <FileText className="w-3 h-3 text-muted-foreground group-hover:text-foreground" />
                                    <span className="text-[12px] truncate">{a.name}</span>
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </ScrollArea>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AnimatedResultShowcase;


"use client";

import React, { useState, useEffect } from 'react';
import { useAI } from '../../hooks/useAI';
import { Note } from '../../lib/notesApi';
import { Sparkles, CheckCircle2, Circle, Hash, Clock, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { notesApi } from '../../lib/notesApi';
import { toast } from 'sonner';

interface AINote extends Note {
  ai_summary?: string;
  ai_action_items?: string[];
  ai_suggested_title?: string;
  ai_key_topics?: string[];
  ai_last_generated?: string;
}

const TypewriterText = ({ text }: { text: string }) => {
  const [displayedText, setDisplayedText] = useState('');
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText(text.substring(0, i));
      i++;
      if (i > text.length) clearInterval(interval);
    }, 50);
    return () => clearInterval(interval);
  }, [text]);
  return <span>{displayedText}</span>;
};

export default function AISidebar({ note, usageCount = 15 }: { note: AINote; usageCount?: number }) {
  const { generateSummary, isGenerating } = useAI();
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});
  const [isApplyingTitle, setIsApplyingTitle] = useState(false);

  const handleGenerate = async () => {
    if (!note.id) return;
    await generateSummary(note.id);
  };

  const handleApplyTitle = async (newTitle: string) => {
    setIsApplyingTitle(true);
    try {
      await notesApi.updateNote(note.id, { title: newTitle });
      toast.success("Title updated!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to update title");
    } finally {
      setTimeout(() => setIsApplyingTitle(false), 500); // Wait for transition
    }
  };

  const toggleCheck = (index: number) => {
    setCheckedItems(prev => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="w-80 border-l border-white/10 bg-black/40 backdrop-blur-xl h-full flex flex-col p-4 overflow-y-auto text-gray-200">
      
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-semibold tracking-wider text-gray-400 uppercase flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          AI Assistant
        </h3>
      </div>

      {!note.ai_summary && !isGenerating && (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
          <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center mb-4">
            <Sparkles className="w-6 h-6 text-indigo-400" />
          </div>
          <p className="text-sm text-gray-400 mb-6">Let AI read your note and extract the key points</p>
          <button
            onClick={handleGenerate}
            className="group relative w-full overflow-hidden rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 p-[1px] transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-0 transition-opacity group-hover:opacity-20 animate-shimmer" />
            <div className="relative flex items-center justify-center gap-2 rounded-lg bg-black/50 px-4 py-2 font-medium text-white backdrop-blur-sm transition-colors group-hover:bg-black/30">
              <Sparkles className="w-4 h-4" />
              Generate AI Summary
            </div>
          </button>
        </div>
      )}

      {isGenerating && (
        <div className="flex-1 space-y-6 animate-pulse">
          <div className="flex items-center justify-center mb-4">
            <p className="text-sm text-indigo-400 font-medium">
              <TypewriterText text="Analyzing your note..." />
            </p>
          </div>
          <div className="space-y-3">
            <div className="h-4 bg-white/5 rounded w-3/4"></div>
            <div className="h-4 bg-white/5 rounded w-full"></div>
            <div className="h-4 bg-white/5 rounded w-5/6"></div>
          </div>
          <div className="space-y-3 pt-4">
            <div className="h-4 bg-white/5 rounded w-1/3 mb-2"></div>
            <div className="h-8 bg-white/5 rounded w-full"></div>
            <div className="h-8 bg-white/5 rounded w-full"></div>
          </div>
          <div className="flex gap-2 pt-4">
            <div className="h-6 bg-white/5 rounded-full w-16"></div>
            <div className="h-6 bg-white/5 rounded-full w-20"></div>
          </div>
        </div>
      )}

      {note.ai_summary && !isGenerating && (
        <div className="space-y-6 flex-1">
          {/* Summary */}
          <div className="p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-sm leading-relaxed text-indigo-100/90 shadow-inner">
            {note.ai_summary}
          </div>

          {/* Suggested Title */}
          {note.ai_suggested_title && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold tracking-wider text-gray-500 uppercase">Suggested Title</h4>
              <button 
                onClick={() => handleApplyTitle(note.ai_suggested_title!)}
                className={`w-full text-left p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-indigo-500/30 transition-all ${isApplyingTitle ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}`}
              >
                <p className="text-sm font-medium text-gray-200">{note.ai_suggested_title}</p>
                <p className="text-xs text-gray-400 mt-1">Click to apply to note</p>
              </button>
            </div>
          )}

          {/* Action Items */}
          {note.ai_action_items && note.ai_action_items.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold tracking-wider text-gray-500 uppercase">Action Items</h4>
              <div className="space-y-2">
                {note.ai_action_items.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-start gap-3 group cursor-pointer transition-all duration-300 animate-in slide-in-from-right-4 fade-in fill-mode-both"
                    style={{ animationDelay: `${idx * 50}ms` }}
                    onClick={() => toggleCheck(idx)}
                  >
                    <div className="mt-0.5 text-indigo-400/70 group-hover:text-indigo-400 transition-colors">
                      {checkedItems[idx] ? (
                        <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                      ) : (
                        <Circle className="w-4 h-4" />
                      )}
                    </div>
                    <span className={`text-sm transition-all ${checkedItems[idx] ? 'text-gray-500 line-through' : 'text-gray-300 group-hover:text-white'}`}>
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Topics */}
          {note.ai_key_topics && note.ai_key_topics.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold tracking-wider text-gray-500 uppercase">Key Topics</h4>
              <div className="flex flex-wrap gap-2">
                {note.ai_key_topics.map((topic, idx) => (
                  <span 
                    key={idx}
                    className="px-2.5 py-1 text-xs font-medium rounded-full bg-white/5 border border-white/10 text-gray-300 flex items-center gap-1.5"
                  >
                    <Hash className="w-3 h-3 text-indigo-400" />
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="pt-6 mt-6 border-t border-white/10 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {note.ai_last_generated ? formatDistanceToNow(new Date(note.ai_last_generated), { addSuffix: true }) : "Just now"}
            </div>
            <button 
              onClick={handleGenerate}
              className="flex items-center gap-1 hover:text-indigo-400 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Regenerate
            </button>
          </div>
        </div>
      )}

      {note.ai_summary && !isGenerating && (
        <div className="mt-4 pt-4 border-t border-white/5">
          <p className="text-[10px] text-gray-600 text-center tracking-wide">
            {usageCount} AI analyses used this week
          </p>
        </div>
      )}
    </div>
  );
}

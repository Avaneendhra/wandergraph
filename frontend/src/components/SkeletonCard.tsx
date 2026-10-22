import React from 'react';

export const SkeletonCard: React.FC = () => {
  return (
    <div className="rounded-2xl bg-slate-900/40 border border-slate-800 p-5 space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-5 w-24 bg-slate-800 rounded-md"></div>
        <div className="h-5 w-16 bg-slate-800 rounded-full"></div>
      </div>
      <div className="h-6 w-3/4 bg-slate-800 rounded-md"></div>
      <div className="h-4 w-1/2 bg-slate-800 rounded-md"></div>
      <div className="h-10 w-full bg-slate-800/60 rounded-xl"></div>
      <div className="h-16 w-full bg-slate-800/40 rounded-xl"></div>
      <div className="flex justify-between pt-2">
        <div className="h-4 w-28 bg-slate-800 rounded"></div>
        <div className="h-6 w-16 bg-slate-800 rounded-lg"></div>
      </div>
    </div>
  );
};

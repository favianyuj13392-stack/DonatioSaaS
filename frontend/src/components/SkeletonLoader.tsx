import React from 'react';

export const SkeletonLoader: React.FC = () => {
  return (
    <div className="min-h-screen bg-white animate-pulse">
      {/* Navbar Skeleton */}
      <div className="border-b border-slate-100 py-4 px-6 max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-200 rounded-xl" />
          <div className="space-y-1.5">
            <div className="w-36 h-4 bg-slate-200 rounded" />
            <div className="w-24 h-3 bg-slate-100 rounded" />
          </div>
        </div>
        <div className="w-28 h-9 bg-slate-100 rounded-xl" />
      </div>

      {/* Hero Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7 space-y-6">
          <div className="w-40 h-5 bg-slate-200 rounded-full" />
          <div className="w-full h-12 bg-slate-200 rounded-2xl" />
          <div className="w-3/4 h-12 bg-slate-200 rounded-2xl" />
          <div className="w-full h-20 bg-slate-100 rounded-xl" />
          <div className="w-full aspect-video bg-slate-200 rounded-3xl" />
          <div className="w-full h-16 bg-slate-100 rounded-2xl" />
        </div>
        <div className="lg:col-span-5">
          <div className="w-full h-[520px] bg-slate-100 rounded-3xl border border-slate-200/60 p-6 space-y-6">
            <div className="w-32 h-6 bg-slate-200 rounded" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-12 bg-slate-200 rounded-xl" />
              <div className="h-12 bg-slate-200 rounded-xl" />
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div className="h-12 bg-slate-200 rounded-xl" />
              <div className="h-12 bg-slate-200 rounded-xl" />
              <div className="h-12 bg-slate-200 rounded-xl" />
              <div className="h-12 bg-slate-200 rounded-xl" />
            </div>
            <div className="w-full h-12 bg-slate-200 rounded-xl" />
            <div className="w-full h-14 bg-slate-300 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
};

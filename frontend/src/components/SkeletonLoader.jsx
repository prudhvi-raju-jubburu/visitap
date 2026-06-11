import React from 'react';

export function CardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden bg-surface border border-white/5 animate-pulse">
      <div className="h-48 skeleton bg-white/5"></div>
      <div className="p-4 space-y-3">
        <div className="h-5 skeleton bg-white/10 rounded w-3/4"></div>
        <div className="h-4 skeleton bg-white/5 rounded w-1/2"></div>
        <div className="h-4 skeleton bg-white/5 rounded w-full"></div>
        <div className="h-4 skeleton bg-white/5 rounded w-5/6"></div>
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => <CardSkeleton key={i} />)}
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg animate-pulse">
      <div className="text-center space-y-4 w-full max-w-2xl px-4">
        <div className="h-10 skeleton bg-white/10 rounded-xl mx-auto w-3/4"></div>
        <div className="h-6 skeleton bg-white/10 rounded-xl mx-auto w-1/2"></div>
        <div className="h-4 skeleton bg-white/5 rounded mx-auto w-2/3"></div>
        <div className="flex gap-3 justify-center mt-6">
          <div className="h-12 w-36 skeleton bg-white/5 rounded-xl"></div>
          <div className="h-12 w-36 skeleton bg-white/5 rounded-xl"></div>
        </div>
      </div>
    </div>
  );
}

export function DistrictCardSkeleton() {
  return (
    <div className="rounded-3xl overflow-hidden bg-surface/40 border border-white/10 flex flex-col justify-between h-full animate-pulse">
      <div className="aspect-[4/3] w-full skeleton bg-white/5"></div>
      <div className="p-6 space-y-4">
        <div className="h-6 skeleton bg-white/10 rounded-lg w-2/3"></div>
        <div className="h-4 skeleton bg-white/5 rounded w-full"></div>
        <div className="h-4 skeleton bg-white/5 rounded w-5/6"></div>
        <div className="h-5 skeleton bg-white/5 rounded-lg w-1/3 pt-2"></div>
      </div>
    </div>
  );
}

export function PlaceCardSkeleton() {
  return (
    <div className="rounded-[32px] overflow-hidden bg-surface/50 backdrop-blur-md border border-white/10 flex flex-col justify-between h-full animate-pulse">
      <div className="aspect-[16/10] w-full skeleton bg-white/5"></div>
      <div className="p-6 space-y-4">
        <div className="h-7 skeleton bg-white/10 rounded-lg w-3/4"></div>
        <div className="flex justify-between items-center gap-3 pt-2">
          <div className="h-8 w-16 skeleton bg-white/5 rounded-xl"></div>
          <div className="h-8 w-24 skeleton bg-white/5 rounded-xl"></div>
        </div>
      </div>
    </div>
  );
}

export function TripCardSkeleton() {
  return (
    <div className="bg-surface/30 border border-white/10 rounded-[2rem] overflow-hidden flex flex-col h-full animate-pulse">
      <div className="aspect-[16/10] skeleton bg-white/5 animate-pulse"></div>
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <div className="h-6 skeleton bg-white/10 rounded-lg w-2/3"></div>
          <div className="h-4 skeleton bg-white/5 rounded w-5/6 mt-2"></div>
          <div className="grid grid-cols-3 gap-2 border-t border-b border-white/5 py-3 my-4">
            <div className="h-8 skeleton bg-white/5 rounded"></div>
            <div className="h-8 skeleton bg-white/5 rounded"></div>
            <div className="h-8 skeleton bg-white/5 rounded"></div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-3 skeleton bg-white/5 rounded w-1/2"></div>
          <div className="grid grid-cols-2 gap-2">
            <div className="h-8 skeleton bg-white/5 rounded-xl"></div>
            <div className="h-8 skeleton bg-white/5 rounded-xl"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CollectionCardSkeleton() {
  return (
    <div className="rounded-[24px] overflow-hidden bg-surfaceLight/10 border border-white/5 flex flex-col sm:flex-row h-full animate-pulse">
      <div className="w-full sm:w-48 h-48 skeleton bg-white/5 shrink-0"></div>
      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <div className="h-6 skeleton bg-white/10 rounded-lg w-1/2"></div>
          <div className="h-4 skeleton bg-white/5 rounded w-5/6 mt-2"></div>
          <div className="h-4 skeleton bg-white/5 rounded w-3/4 mt-2"></div>
        </div>
        <div className="flex justify-between items-center pt-3 border-t border-white/5">
          <div className="h-4 w-24 skeleton bg-white/5 rounded"></div>
          <div className="h-4 w-16 skeleton bg-white/5 rounded"></div>
        </div>
      </div>
    </div>
  );
}

export function ReviewSkeleton() {
  return (
    <div className="bg-surface/30 border border-white/5 rounded-2xl p-5 space-y-4 animate-pulse">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full skeleton bg-white/10"></div>
          <div className="space-y-1.5">
            <div className="h-4 w-28 skeleton bg-white/10 rounded"></div>
            <div className="h-3 w-20 skeleton bg-white/5 rounded"></div>
          </div>
        </div>
        <div className="h-6 w-16 skeleton bg-white/5 rounded-lg"></div>
      </div>
      <div className="space-y-2">
        <div className="h-4 skeleton bg-white/5 rounded w-full"></div>
        <div className="h-4 skeleton bg-white/5 rounded w-11/12"></div>
        <div className="h-4 skeleton bg-white/5 rounded w-3/4"></div>
      </div>
    </div>
  );
}

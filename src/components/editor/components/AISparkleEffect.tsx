'use client';

import React from 'react';
import { SparkleEffect } from '../types/aiToolbar';

interface AISparkleEffectProps {
  sparkles: SparkleEffect[];
}

export const AISparkleEffect: React.FC<AISparkleEffectProps> = ({
  sparkles
}) => {
  return (
    <>
      {sparkles.map(sparkle => (
        <div
          key={sparkle.id}
          className="sparkle"
          style={{
            left: `${sparkle.x}%`,
            top: `${sparkle.y}%`,
            width: `${sparkle.size}px`,
            height: `${sparkle.size}px`,
            animationDelay: `${sparkle.delay}s`
          }}
        />
      ))}
    </>
  );
}; 
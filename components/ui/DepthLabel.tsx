/**
 * DepthLabel — visual indicator of complexity depth per accordion section.
 * Basic / Standard / Advanced
 */
'use client';
const styles = {
  basic:    'text-[#555]',
  standard: 'text-[#4f8ef5]/60',
  advanced: 'text-[#f5a623]/60',
};
export function DepthLabel({ level }: { level: 'basic' | 'standard' | 'advanced' }) {
  return (
    <span className={`font-mono text-[0.55rem] tracking-[0.12em] uppercase ml-2 ${styles[level]}`}>
      {level}
    </span>
  );
}

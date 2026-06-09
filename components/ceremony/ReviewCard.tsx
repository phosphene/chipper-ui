'use client';
interface Props { label: string; value: string; source?: 'detected'|'user'; note?: string; editable?: boolean; }
export function ReviewCard({ label, value, source, note, editable }: Props) {
  return (
    <div className={`mb-2 p-3 rounded-md bg-[#222] border relative ${editable ? 'border-[#4f8ef5]/25' : 'border-white/08'}`}>
      <p className="font-mono text-[0.58rem] tracking-[0.15em] uppercase text-[#555] mb-1">{label}</p>
      <p className={`text-[13px] ${source === 'detected' ? 'text-[#4f8ef5]' : 'text-[#e2e2e2]'}`}>
        {value.replace(/-/g, ' ')}
      </p>
      {note && <p className="text-[0.72rem] text-[#444] italic mt-1">{note}</p>}
      {editable && (
        <span className="absolute top-2 right-2 font-mono text-[0.55rem] tracking-[0.1em] uppercase text-[#4f8ef5] px-1.5 py-0.5 border border-[#4f8ef5]/30 rounded">Edit</span>
      )}
    </div>
  );
}

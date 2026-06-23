'use client';
/**
 * ProgressiveForm — Stage 1 entry form.
 *
 * One combined form with a single "Proceed →" button.
 * Completed sections compress into summary lines above a divider;
 * the active section sits below at full visual weight.
 * The user never scrolls — content rises to them.
 *
 * Field order (Jan, June 20):
 *   1. "What are you working on?" — description textarea
 *   2. Upload zone — documents / audio / images / any format
 *   3. "+ Add more details" expander
 *   4. "I am a:" — Student / Scholar / Practitioner pills
 *   5. Domain [optional] — type-in autocomplete or multi-select
 *
 * T-389
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useCeremonyStore } from '@/store/ceremony';
import { DomainPicker } from '@/components/entry/DomainPicker';
import type { SelectedDomain } from '@/components/entry/DomainPicker';
import { Stage2 } from '@/components/entry/Stage2';
import type { Stage2Data } from '@/components/entry/Stage2';
import { DetectionChips } from '@/components/entry/DetectionChips';
import type { DetectionChipsResult } from '@/components/entry/DetectionChips';
import { useDetection } from '@/hooks/useDetection';
import { IntentSelection } from '@/components/entry/IntentSelection';
import type { IntentValue } from '@/components/entry/IntentSelection';
import { RouteSelection } from '@/components/entry/RouteSelection';
import type { RouteValue } from '@/components/entry/RouteSelection';
import { ConfirmationScreen } from '@/components/entry/ConfirmationScreen';
import type { ConfirmationData } from '@/components/entry/ConfirmationScreen';
import { ReviewScreen } from '@/components/entry/ReviewScreen';

// ── Section definitions ──────────────────────────────────────

type SectionId = 'description' | 'upload' | 'details' | 'role' | 'domain';

interface SectionState {
  id: SectionId;
  label: string;
  status: 'complete' | 'active' | 'pending';
  summary: string;
}

const SECTION_ORDER: SectionId[] = ['description', 'upload', 'details', 'role', 'domain'];

const SECTION_LABELS: Record<SectionId, string> = {
  description: 'What are you working on?',
  upload: 'Upload',
  details: 'Additional details',
  role: 'Role',
  domain: 'Domain',
};

// ── Role options ─────────────────────────────────────────────

type RoleValue = 'student' | 'scholar' | 'practitioner';

const ROLE_OPTIONS: { value: RoleValue; label: string; testId: string }[] = [
  { value: 'student', label: 'Student', testId: 'entry-role-student' },
  { value: 'scholar', label: 'Scholar', testId: 'entry-role-scholar' },
  { value: 'practitioner', label: 'Practitioner', testId: 'entry-role-practitioner' },
];


// ── Component ────────────────────────────────────────────────

export function ProgressiveForm() {
  const store = useCeremonyStore();

  // ── Detection hook (T-392) — must be before callbacks that use detect ──
  const { detect, result: detectionResult, isLoading: isDetecting, error: detectionError, hasAcademicMarkers } = useDetection();

  // Section tracking — description starts active
  const [sections, setSections] = useState<SectionState[]>(() =>
    SECTION_ORDER.map((id, i) => ({
      id,
      label: SECTION_LABELS[id],
      status: i === 0 ? 'active' as const : 'pending' as const,
      summary: '',
    }))
  );

  // ── Field state ────────────────────────────────────────────

  // 1. Description
  const [descriptionText, setDescriptionText] = useState('');

  // 2. Upload
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 3. Details expander
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [detailsText, setDetailsText] = useState('');

  // 4. Role
  const [selectedRole, setSelectedRole] = useState<RoleValue | null>(null);

  // 5. Domain (DomainPicker)
  const [domainText, setDomainText] = useState('');
  const [pickerDomains, setPickerDomains] = useState<SelectedDomain[]>([]);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [domainDropdownOpen, setDomainDropdownOpen] = useState(false);
  const [domainFilter, setDomainFilter] = useState('');

  // Sync pickerDomains → selectedDomains for backward compatibility
  useEffect(() => {
    setSelectedDomains(pickerDomains.map(d => d.entry.label));
  }, [pickerDomains]);

  // ── Section navigation ─────────────────────────────────────

  const completeSection = useCallback((sectionId: SectionId, summary: string) => {
    setSections(prev => {
      const idx = prev.findIndex(s => s.id === sectionId);
      if (idx === -1) return prev;
      return prev.map((s, i) => {
        if (i === idx) return { ...s, status: 'complete' as const, summary };
        if (i === idx + 1 && s.status === 'pending') return { ...s, status: 'active' as const };
        return s;
      });
    });
  }, []);

  const advanceToNext = useCallback((afterId: SectionId) => {
    setSections(prev => {
      const idx = prev.findIndex(s => s.id === afterId);
      if (idx === -1) return prev;
      // Find next pending
      const nextIdx = prev.findIndex((s, i) => i > idx && s.status === 'pending');
      if (nextIdx === -1) return prev;
      return prev.map((s, i) => {
        if (i === nextIdx) return { ...s, status: 'active' as const };
        return s;
      });
    });
  }, []);

  const reopenSection = useCallback((sectionId: SectionId) => {
    const idx = SECTION_ORDER.indexOf(sectionId);
    if (idx === -1) return;
    setSections(prev => prev.map((s, i) => {
      if (i === idx) return { ...s, status: 'active' as const };
      if (i > idx && s.status === 'active') return { ...s, status: 'pending' as const };
      return s;
    }));
  }, []);

  // ── Section done handlers ──────────────────────────────────

  const handleDescriptionDone = useCallback(() => {
    if (descriptionText.trim().length < 15) return;
    store.updateMakerDeclaration({ freeText: descriptionText });
    const summary = descriptionText.trim().length > 80
      ? descriptionText.trim().slice(0, 80) + '…'
      : descriptionText.trim();
    completeSection('description', summary);
  }, [descriptionText, store, completeSection]);

  const handleUploadDone = useCallback(() => {
    const summary = uploadedFiles.length > 0
      ? `${uploadedFiles.length} file${uploadedFiles.length > 1 ? 's' : ''}`
      : '(no files)';
    completeSection('upload', summary);
  }, [uploadedFiles, completeSection]);

  const handleDetailsDone = useCallback(() => {
    const summary = detailsText.trim()
      ? (detailsText.trim().length > 60 ? detailsText.trim().slice(0, 60) + '…' : detailsText.trim())
      : '(none)';
    completeSection('details', summary);
  }, [detailsText, completeSection]);

  const handleRoleDone = useCallback(() => {
    const summary = selectedRole
      ? ROLE_OPTIONS.find(r => r.value === selectedRole)?.label ?? selectedRole
      : '(none selected)';
    completeSection('role', summary);
  }, [selectedRole, completeSection]);

  const handleDomainDone = useCallback(() => {
    const parts = [...selectedDomains];
    if (domainText.trim()) parts.push(domainText.trim());
    const combined = parts.join(', ');
    if (combined) {
      store.updateMakerDeclaration({ tradition: { value: combined, source: 'user' } });
    }
    completeSection('domain', combined || '(none selected)');
  }, [selectedDomains, domainText, store, completeSection]);

  // ── Upload handlers ────────────────────────────────────────

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setUploadedFiles(prev => [...prev, ...files]);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) {
      setUploadedFiles(prev => [...prev, ...files]);
    }
  }, []);

  const removeFile = useCallback((idx: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== idx));
  }, []);

  // ── Proceed handler ────────────────────────────────────────

  const handleProceed = useCallback(() => {
    // Write all data to store
    store.updateMakerDeclaration({ freeText: descriptionText });
    if (selectedRole) {
      // Map role to standing for store compatibility
      const standingMap: Record<RoleValue, string> = {
        student: 'graduate-researcher',
        scholar: 'professor',
        practitioner: 'practitioner',
      };
      store.updateMakerDeclaration({
        standing: { value: standingMap[selectedRole] as any, source: 'user' },
      });
    }
    const domainParts = [...selectedDomains];
    if (domainText.trim()) domainParts.push(domainText.trim());
    if (domainParts.length > 0) {
      store.updateMakerDeclaration({ tradition: { value: domainParts.join(', '), source: 'user' } });
    }

    // Detection-first flow (T-392): call /api/detect before showing Stage 2
    setCurrentStage('detecting');
    detect(descriptionText);
    console.log('[ProgressiveForm] Proceed — Stage 1 complete, detecting...');
  }, [descriptionText, selectedRole, selectedDomains, domainText, store, detect]);

  // ── Detection complete handler (T-392) ─────────────────────

  const handleDetectionComplete = useCallback((chipResult: DetectionChipsResult) => {
    // Cascade: confirmed work_type pre-selects matching work-type in Stage 2
    // Cascade: confirmed domain pre-fills domain in Stage 1 if not already set
    if (chipResult.domain && pickerDomains.length === 0) {
      // Domain cascade: update store tradition from detection
      store.updateMakerDeclaration({ tradition: { value: chipResult.domain, source: 'detected' } });
    }

    // Advance to Stage 2 with detected values available in store
    setCurrentStage('stage2');
    console.log('[ProgressiveForm] Detection confirmed, advancing to Stage 2', chipResult);
  }, [pickerDomains.length, store]);

  // ── Stage navigation ───────────────────────────────────────

  const [currentStage, setCurrentStage] = useState<'stage1' | 'detecting' | 'stage2' | 'layer2' | 'layer3' | 'layer4' | 'layer5'>('stage1');

  // ── Layer 2: selected intents (T-393) ──────────────────────
  const [selectedIntents, setSelectedIntents] = useState<IntentValue[]>([]);

  // ── Layer 3: selected routes (T-394) ───────────────────────
  const [selectedRoutes, setSelectedRoutes] = useState<RouteValue[]>([]);

  // ── Stage 2 data for Layer 4 confirmation (T-395) ──────────
  const [stage2Data, setStage2Data] = useState<{ makerRole: string; creatorType: string; workType: string } | null>(null);


  // ── Derived state ──────────────────────────────────────────

  const hasEnoughText = descriptionText.trim().length >= 15;
  const activeSection = sections.find(s => s.status === 'active');
  const completedSections = sections.filter(s => s.status === 'complete');


  // ── Render ─────────────────────────────────────────────────

  // ── Stage 2 proceed handler ────────────────────────────────

  const handleStage2Proceed = useCallback((data: Stage2Data) => {
    // Write Stage 2 data to store
    if (data.makerRole) {
      const standingMap: Record<string, string> = {
        student: 'graduate-researcher',
        scholar: 'professor',
        practitioner: 'practitioner',
      };
      store.updateMakerDeclaration({
        standing: { value: standingMap[data.makerRole] as any, source: 'user' },
      });
    }
    if (data.workType && data.workType !== 'none') {
      store.updateWorkClassification({
        workType: { value: data.workType as any, source: 'user' },
      });
    }
    // Store Stage 2 data for Layer 4 confirmation (T-395)
    setStage2Data({
      makerRole: data.makerRole,
      creatorType: data.creatorType,
      workType: data.workType,
    });
    // Advance to Layer 2 intent selection (T-393)
    setCurrentStage('layer2');
    console.log('[ProgressiveForm] Stage 2 complete, advancing to Layer 2', data);
  }, [store]);

  // ── Layer 2: Intent selection proceed handler (T-393) ──────

  const handleIntentProceed = useCallback((intents: IntentValue[]) => {
    setSelectedIntents(intents);
    setCurrentStage('layer3');
    console.log('[ProgressiveForm] Layer 2 complete, advancing to Layer 3, intents:', intents);
  }, []);

  // ── Layer 3: Route selection proceed handler (T-394) ───────

  const handleRouteProceed = useCallback((routes: RouteValue[]) => {
    setSelectedRoutes(routes);
    setCurrentStage('layer4');
    console.log('[ProgressiveForm] Layer 3 complete, advancing to Layer 4, routes:', routes);
  }, []);

  // ── Layer 4: Confirmation change handler (T-395) ───────────

  const handleConfirmationChange = useCallback((field: keyof ConfirmationData) => {
    // Navigate back to the relevant stage based on field
    switch (field) {
      case 'description':
        reopenSection('description');
        setCurrentStage('stage1');
        break;
      case 'role':
      case 'creatorType':
      case 'workType':
        setCurrentStage('stage2');
        break;
      case 'domains':
        reopenSection('domain');
        setCurrentStage('stage1');
        break;
      default:
        break;
    }
    console.log('[ProgressiveForm] Layer 4 change requested:', field);
  }, [reopenSection]);

  // ── Layer 4: Confirmation proceed handler (T-395) ──────────

  const handleConfirmationConfirm = useCallback(() => {
    setCurrentStage('layer5');
    console.log('[ProgressiveForm] Layer 4 confirmed, advancing to Layer 5');
  }, []);

  // ── Layer 5: Begin handler (T-395) ─────────────────────────

  const handleBegin = useCallback(() => {
    // Trigger evaluation/ceremony flow
    store.advanceStage();
    console.log('[ProgressiveForm] Layer 5 begin — launching evaluation');
  }, [store]);

  return (
    <div data-testid="progressive-form" className="h-full flex flex-col px-5 py-6 overflow-hidden">

      {/* ── Completed stack (above the line) ── */}
      <div className="flex-shrink-0 space-y-1 mb-3">
        {completedSections.map(section => (
          <button
            key={section.id}
            data-testid={`section-${section.id}-complete`}
            onClick={() => reopenSection(section.id)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-350 ease-out hover:bg-gray-50 group"
          >
            <span className="text-xs text-gray-400 font-medium uppercase tracking-widest whitespace-nowrap">
              {section.label}
            </span>
            <span className="text-xs text-gray-400 truncate flex-1">
              {section.summary}
            </span>
            <span className="text-[0.6rem] text-gray-300 group-hover:text-gray-500 transition-colors">
              edit
            </span>
          </button>
        ))}
      </div>

      {/* ── Divider ── */}
      {completedSections.length > 0 && (
        <hr className="border-gray-200 mb-4 flex-shrink-0" />
      )}

      {/* ── Detection chips (T-392) — between Stage 1 and Stage 2 ── */}
      {currentStage === 'detecting' && (
        <div className="flex-1 overflow-y-auto animate-rise">
          <DetectionChips
            result={detectionResult!}
            isLoading={isDetecting}
            error={detectionError}
            onComplete={handleDetectionComplete}
            hasAcademicMarkers={hasAcademicMarkers}
          />
        </div>
      )}

      {/* ── Stage 2 ── */}
      {currentStage === 'stage2' && (
        <div className="flex-1 overflow-y-auto animate-rise">
          <Stage2
            selectedDomains={pickerDomains}
            onProceed={handleStage2Proceed}
          />
        </div>
      )}

      {/* ── Layer 2: Intent selection (T-393) ── */}
      {currentStage === 'layer2' && (
        <div className="flex-1 overflow-y-auto animate-rise">
          <IntentSelection
            onProceed={handleIntentProceed}
          />
        </div>
      )}

      {/* ── Layer 3: Route selection (T-394) ── */}
      {currentStage === 'layer3' && (
        <div className="flex-1 overflow-y-auto animate-rise">
          <RouteSelection
            selectedIntents={selectedIntents}
            onProceed={handleRouteProceed}
          />
        </div>
      )}

      {/* ── Layer 4: Confirmation (T-395) ── */}
      {currentStage === 'layer4' && (
        <div className="flex-1 overflow-y-auto animate-rise">
          <ConfirmationScreen
            data={{
              description: descriptionText,
              uploadFilename: uploadedFiles.length > 0 ? uploadedFiles[0].name : null,
              role: (stage2Data?.makerRole ?? selectedRole ?? 'scholar') as any,
              creatorType: (stage2Data?.creatorType ?? 'sole') as any,
              workType: (stage2Data?.workType ?? 'none') as any,
              domains: selectedDomains,
              intents: selectedIntents,
              routes: selectedRoutes,
            }}
            onChangeField={handleConfirmationChange}
            onConfirm={handleConfirmationConfirm}
          />
        </div>
      )}

      {/* ── Layer 5: Review (T-395) ── */}
      {currentStage === 'layer5' && (
        <div className="flex-1 overflow-y-auto animate-rise">
          <ReviewScreen
            selectedRoutes={selectedRoutes}
            onBegin={handleBegin}
          />
        </div>
      )}

      {/* ── Active section (below the line) — Stage 1 only ── */}
      {currentStage === 'stage1' && (
      <div className="flex-1 overflow-y-auto">

        {activeSection && (
          <div
            key={activeSection.id}
            data-testid={`section-${activeSection.id}`}
            className="animate-rise"
          >
            {/* ── 1. Description ── */}
            {activeSection.id === 'description' && (
              <div className="space-y-3" data-testid="section-description-input">
                <h1 className="text-2xl font-light text-black leading-tight">
                  What are you working on?
                </h1>
                <textarea
                  data-testid="entry-text-field"
                  rows={5}
                  value={descriptionText}
                  onChange={e => setDescriptionText(e.target.value)}
                  placeholder="Describe your work — a research paper, a finding, an argument, a null result..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300 outline-none focus:border-gray-400 resize-none"
                  autoFocus
                />
                <div className="flex justify-end">
                  <button
                    data-testid="btn-done-description"
                    onClick={handleDescriptionDone}
                    disabled={!hasEnoughText}
                    className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors
                      ${hasEnoughText
                        ? 'text-gray-900 border border-gray-300 hover:bg-gray-50 cursor-pointer'
                        : 'text-gray-300 border border-gray-100 cursor-not-allowed'}`}
                  >
                    Done
                  </button>
                </div>
              </div>
            )}

            {/* ── 2. Upload zone ── */}
            {activeSection.id === 'upload' && (
              <div className="space-y-3">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-2">
                  Upload
                </p>
                <div
                  data-testid="entry-upload-zone"
                  onDragOver={e => e.preventDefault()}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-all"
                >
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  <span className="text-sm text-gray-500">
                    Upload — Documents / Audio / Images / Any format
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    data-testid="entry-file-input"
                  />
                </div>

                {/* Uploaded file list */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-1">
                    {uploadedFiles.map((file, idx) => (
                      <div key={`${file.name}-${idx}`} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg text-xs text-gray-600">
                        <span className="truncate flex-1">{file.name}</span>
                        <span className="text-gray-400">{(file.size / 1024).toFixed(0)} KB</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <button
                    data-testid="btn-skip-upload"
                    onClick={() => { completeSection('upload', '(no files)'); }}
                    className="px-4 py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    Skip →
                  </button>
                  <button
                    data-testid="btn-done-upload"
                    onClick={handleUploadDone}
                    className="px-4 py-2 text-xs font-medium text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}

            {/* ── 3. Details expander ── */}
            {activeSection.id === 'details' && (
              <div className="space-y-3">
                {!detailsExpanded ? (
                  <button
                    data-testid="entry-details-expander"
                    onClick={() => setDetailsExpanded(true)}
                    className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Optional: + Add more details
                  </button>
                ) : (
                  <div>
                    <button
                      data-testid="entry-details-expander"
                      onClick={() => setDetailsExpanded(false)}
                      className="text-sm text-gray-500 hover:text-gray-700 transition-colors mb-2"
                    >
                      − Hide details
                    </button>
                    <textarea
                      data-testid="entry-details-text"
                      rows={6}
                      value={detailsText}
                      onChange={e => setDetailsText(e.target.value)}
                      placeholder="Share additional context about your work..."
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300 outline-none focus:border-gray-400 resize-none"
                      autoFocus
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <button
                    data-testid="btn-skip-details"
                    onClick={() => { completeSection('details', '(none)'); }}
                    className="px-4 py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    Skip →
                  </button>
                  <button
                    data-testid="btn-done-details"
                    onClick={handleDetailsDone}
                    className="px-4 py-2 text-xs font-medium text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}

            {/* ── 4. Role pills ── */}
            {activeSection.id === 'role' && (
              <div className="space-y-3">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-2">
                  I am a:
                </p>
                <div className="flex gap-2">
                  {ROLE_OPTIONS.map(({ value, label, testId }) => (
                    <button
                      key={value}
                      data-testid={testId}
                      onClick={() => setSelectedRole(prev => prev === value ? null : value)}
                      className={`px-5 py-2.5 rounded-full border text-sm font-medium transition-all
                        ${selectedRole === value
                          ? 'border-gray-900 bg-gray-900 text-white'
                          : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    data-testid="btn-skip-role"
                    onClick={() => { completeSection('role', '(none selected)'); }}
                    className="px-4 py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    Skip →
                  </button>
                  <button
                    data-testid="btn-done-role"
                    onClick={handleRoleDone}
                    className="px-4 py-2 text-xs font-medium text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}

            {/* ── 5. Domain [optional] — DomainPicker (T-390) ── */}
            {activeSection.id === 'domain' && (
              <div data-testid="entry-domain-input" className="space-y-3">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-2">
                  Domain <span className="normal-case font-normal text-gray-400">(optional)</span>
                </p>

                <DomainPicker
                  selected={pickerDomains}
                  onChange={setPickerDomains}
                />

                <div className="flex justify-end gap-2">
                  <button
                    data-testid="btn-skip-domain"
                    onClick={() => { completeSection('domain', '(none selected)'); }}
                    className="px-4 py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    Skip →
                  </button>
                  <button
                    data-testid="btn-done-domain"
                    onClick={handleDomainDone}
                    className="px-4 py-2 text-xs font-medium text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Proceed button — always visible ── */}
        <div className="mt-6">
          <button
            data-testid="entry-proceed-btn"
            onClick={handleProceed}
            disabled={!hasEnoughText}
            className={`w-full py-4 rounded-xl text-sm font-medium transition-all
              ${hasEnoughText
                ? 'bg-gray-900 text-white hover:bg-gray-700 cursor-pointer'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
          >
            Proceed →
          </button>
        </div>

        {/* ── "As you proceed..." section ── */}
        <div className="mt-8 px-1" data-testid="as-you-proceed">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-2">
            As you proceed…
          </p>
          <ul className="space-y-1.5 text-xs text-gray-500 leading-relaxed">
            <li className="flex gap-2">
              <span className="text-gray-400">•</span>
              <span>Woodchipper facilitates development, evaluation, review, editing, of your work. You can loop the process.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-gray-400">•</span>
              <span>Each phase of your work will be saved, and you can revisit earlier versions.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-gray-400">•</span>
              <span>Woodchipper is designed to be open about its capabilities and its limits.</span>
            </li>
          </ul>
        </div>

      </div>
      )}
    </div>
  );
}

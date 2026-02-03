export type SimpleStage = {
  stage: string;
  label: string;
  completed: boolean;
  isCurrent: boolean;
  helperText?: string;
};

export function normalizeStageKey(stage?: string) {
  return (stage ?? '').toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');
}

export function isApproved(doc: any): boolean {
  if (!doc) return false;
  const direct = doc.approved === true || doc.isApproved === true;
  if (direct) return true;
  const status = (doc.status ?? doc.approvalStatus ?? doc.approval_status ?? '').toString().toLowerCase();
  if (status === 'approved' || status === 'auto_approved') return true;
  if (doc.approvedAt || doc.approved_at) return true;
  return false;
}

export function isCompletedJobCard(jobCard: any): boolean {
  if (!jobCard) return false;
  const status = (jobCard.status ?? '').toString().toLowerCase();
  return status === 'completed' || status === 'done' || status === 'closed';
}

export function buildSalesOrderStages(args: {
  quoteStatus?: string;
  invoiceId?: string | null;
}): SimpleStage[] {
  const quoteApproved = (args.quoteStatus ?? '').toLowerCase() === 'approved';
  const invoiceCreated = !!args.invoiceId;
  const stages = [
    { stage: 'quote', label: 'Quote', completed: quoteApproved, isCurrent: !quoteApproved },
    { stage: 'invoice', label: 'Invoice', completed: invoiceCreated, isCurrent: quoteApproved && !invoiceCreated },
  ];
  // if both completed, keep current as invoice
  if (quoteApproved && invoiceCreated) {
    stages[0].isCurrent = false;
    stages[1].isCurrent = true;
  }
  return stages;
}

export function buildWorkOrderStages(args: {
  preChecklist?: any;
  jobCard?: any;
  postChecklist?: any;
  invoice?: any;
}): SimpleStage[] {
  const preDone = isApproved(args.preChecklist);
  const jobDone = isCompletedJobCard(args.jobCard);
  const postDone = isApproved(args.postChecklist);
  const invoiceCreated = !!args.invoice;
  // If you want “completed” to mean “paid”, tighten this check.
  const invoiceDone =
    invoiceCreated &&
    (['paid', 'completed', 'delivered'].includes(((args.invoice.status ?? '') as string).toString().toLowerCase()) ||
      args.invoice.paid === true);

  const stages: SimpleStage[] = [
    { stage: 'pre_checklist', label: 'Pre-Checklist', completed: preDone, isCurrent: false },
    { stage: 'job_card', label: 'Job Card', completed: jobDone, isCurrent: false },
    { stage: 'post_checklist', label: 'Post-Checklist', completed: postDone, isCurrent: false },
    { stage: 'invoice', label: 'Invoice', completed: invoiceCreated, isCurrent: false },
  ];

  // Determine current stage: first incomplete stage.
  const idx = stages.findIndex((s) => !s.completed);
  if (idx >= 0) stages[idx].isCurrent = true;
  else stages[stages.length - 1].isCurrent = true;

  // helper text tweaks
  stages.forEach((s) => {
    if (s.stage === 'pre_checklist' && preDone) s.helperText = '✓ Approved';
    if (s.stage === 'job_card' && jobDone) s.helperText = '✓ Completed';
    if (s.stage === 'post_checklist' && postDone) s.helperText = '✓ Approved';
    if (s.stage === 'invoice' && invoiceCreated) s.helperText = invoiceDone ? '✓ Completed' : 'Created';
  });

  return stages;
}

export function computeProgress(stages: { completed: boolean }[]) {
  const total = stages.length;
  const done = stages.filter((s) => s.completed).length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  return { total, done, percent };
}

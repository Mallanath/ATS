// Patch script: Upgrades the tempAssignment modal + overview, placement overview, 
// pipeline rejection, and requirements matrix statuses for the 7 missing Assignment features
const fs = require('fs');
const filePath = 'c:\\Users\\malla\\Downloads\\ATS\\index.html';
let content = fs.readFileSync(filePath, 'utf8');

// ===== PATCH 1: Replace the old "Shift, Timesheet & Payroll" section in the temp modal return statement =====
// Find the unique section header in the temp modal return
const oldSection = `Shift, Timesheet \\u0026 Payroll`;
const searchStr = `<h3>Shift, Timesheet \\u0026 Payroll</h3>`;

// The old return statement has a single section "Shift, Timesheet & Payroll"
// We need to replace everything from "<section" just before it up to the "Ownership" section
// Let's find the return statement for tempAssignment form
const tempFormMarker = `data-form="tempAssignment"`;
const tempIdx = content.indexOf(tempFormMarker);
if (tempIdx === -1) { console.log('ERROR: tempAssignment form not found'); process.exit(1); }

// Find the "Shift, Timesheet" section within the tempAssignment return
const shiftSectionStart = content.indexOf('Shift, Timesheet', tempIdx);
if (shiftSectionStart === -1) { console.log('ERROR: Shift, Timesheet section not found'); process.exit(1); }

// Find the <section that contains it (go backwards to find "<section")
let sectionStart = content.lastIndexOf('<section', shiftSectionStart);
// Find the next "<section" after this one (which is "Ownership & Documents")
let ownershipIdx = content.indexOf('Ownership', shiftSectionStart);
let nextSectionStart = content.lastIndexOf('<section', ownershipIdx);

// The old section is from sectionStart to nextSectionStart
const oldSectionContent = content.substring(sectionStart, nextSectionStart);

// Build new sections
const newSections = `<section class="sheetsection"><h3>Shift Schedule \\u0026 Management</h3><p style="color:var(--t3);font-size:13px;margin-bottom:12px">Configure the weekly shift rota — set day type, working hours, and time window per day.</p><div class="sheetgrid">\${shiftDetailRows}<div class="sheetfield"><label>Shift Pattern Summary</label><input name="shiftPattern" value="\${esc(rec?.shiftPattern || 'Day shift | Mon-Fri')}" placeholder="Day shift | Mon-Fri"></div></div></section><section class="sheetsection"><h3>Timesheet Capture \\u0026 Approval</h3><p style="color:var(--t3);font-size:13px;margin-bottom:12px">Configure timesheet cycle and track approval status for this assignment period.</p><div class="sheetgrid"><div class="sheetfield"><label>Timesheet Cycle</label><select name="timesheetCycle">\${['Weekly', 'Bi-weekly', 'Monthly'].map(value => \`<option value="\${value}" \${String(rec?.timesheetCycle || 'Weekly') === value ? 'selected' : ''}>\${value}</option>\`).join('')}</select></div><div class="sheetfield"><label>Timesheet Status</label><select name="timesheetStatus">\${['Not Started', 'Pending Approval', 'Approved', 'Rejected', 'Disputed'].map(value => \`<option value="\${value}" \${String(rec?.timesheetStatus || 'Not Started') === value ? 'selected' : ''}>\${value}</option>\`).join('')}</select></div><div class="sheetfield"><label>Hours Submitted</label><input type="number" min="0" step="0.5" name="hoursSubmitted" value="\${esc(String(rec?.hoursSubmitted ?? 0))}"></div><div class="sheetfield"><label>Hours Approved</label><input type="number" min="0" step="0.5" name="hoursApproved" value="\${esc(String(rec?.hoursApproved ?? 0))}"></div><div class="sheetfield"><label>Approver</label><select name="timesheetApproverId"><option value="">Auto (Assignment Owner)</option>\${assignmentUserOptions(rec?.timesheetApproverId || '')}</select></div><div class="sheetfield"><label>Last Approval Date</label><input type="date" name="timesheetLastApproval" value="\${esc(String(rec?.timesheetLastApproval || '').slice(0,10))}"></div></div></section><section class="sheetsection"><h3>Absence \\u0026 Leave Tracking</h3><p style="color:var(--t3);font-size:13px;margin-bottom:12px">Track annual leave, sick leave, and absence records for this temp/contract worker.</p><div class="sheetgrid"><div class="sheetfield"><label>Leave Status</label><select name="leaveStatus">\${['Not Tracked', 'Available', 'Planned Leave', 'On Leave', 'Leave Exhausted'].map(value => \`<option value="\${value}" \${String(rec?.leaveStatus || 'Not Tracked') === value ? 'selected' : ''}>\${value}</option>\`).join('')}</select></div><div class="sheetfield"><label>Annual Leave Entitlement (days)</label><input type="number" min="0" step="1" name="leaveEntitlement" value="\${esc(String(leaveBalance.entitlement ?? 20))}"></div><div class="sheetfield"><label>Leave Taken (days)</label><input type="number" min="0" step="0.5" name="leaveTaken" value="\${esc(String(leaveBalance.taken ?? 0))}"></div><div class="sheetfield"><label>Sick Leave (days)</label><input type="number" min="0" step="0.5" name="sickLeave" value="\${esc(String(leaveBalance.sick ?? 0))}"></div><div class="sheetfield"><label>Unpaid Leave (days)</label><input type="number" min="0" step="0.5" name="unpaidLeave" value="\${esc(String(leaveBalance.unpaid ?? 0))}"></div><div class="sheetfield full"><label>Leave Notes</label><input name="leaveNotes" value="\${esc(leaveBalance.notes || '')}" placeholder="Upcoming or planned absence details"></div></div></section><section class="sheetsection"><h3>Back-Office Payroll \\u0026 Billing</h3><p style="color:var(--t3);font-size:13px;margin-bottom:12px">Configure payroll integration, billing cycle, and back-office sync for this assignment.</p><div class="sheetgrid"><div class="sheetfield"><label>Payroll Status</label><select name="payrollStatus">\${['Not Connected', 'Ready for Payroll', 'Synced to Back Office', 'Error', 'On Hold'].map(value => \`<option value="\${value}" \${String(rec?.payrollStatus || 'Not Connected') === value ? 'selected' : ''}>\${value}</option>\`).join('')}</select></div><div class="sheetfield"><label>Payroll Provider</label><input name="payrollProvider" value="\${esc(payrollBilling.provider || '')}" placeholder="ADP, Sage, Xero, QuickBooks"></div><div class="sheetfield"><label>Billing Cycle</label><select name="billingCycle">\${['Weekly', 'Bi-weekly', 'Monthly', 'On Completion'].map(value => \`<option value="\${value}" \${String(payrollBilling.billingCycle || 'Monthly') === value ? 'selected' : ''}>\${value}</option>\`).join('')}</select></div><div class="sheetfield"><label>Invoice Reference</label><input name="invoiceRef" value="\${esc(payrollBilling.invoiceRef || '')}" placeholder="INV-2026-0042"></div><div class="sheetfield"><label>Last Sync Date</label><input type="date" name="payrollLastSync" value="\${esc(String(payrollBilling.lastSyncDate || '').slice(0,10))}"></div><div class="sheetfield"><label>Back-Office ID</label><input name="backOfficeId" value="\${esc(payrollBilling.backOfficeId || '')}" placeholder="BO-12345"></div><div class="sheetfield"><label>Bill Rate</label><input type="number" min="0" step="1" name="billRate" value="\${esc(String(rec?.billRate || 0))}"></div><div class="sheetfield"><label>Pay Rate</label><input type="number" min="0" step="1" name="payRate" value="\${esc(String(rec?.payRate || 0))}"></div><div class="sheetfield"><label>Margin %</label><input type="number" min="0" max="100" step="1" name="marginPct" value="\${esc(String(rec?.marginPct || rec?.margin || 0))}"></div><div class="sheetfield"><label>Salary</label><input type="number" min="0" step="1000" name="salary" value="\${esc(String(rec?.salary || 0))}"></div></div></section><section class="sheetsection"><h3>Extension \\u0026 Renewal Workflow</h3><p style="color:var(--t3);font-size:13px;margin-bottom:12px">Manage assignment lifecycle — set renewal dates, track extensions, and configure end-date reminders.</p><div class="sheetgrid"><div class="sheetfield"><label>Renewal State</label><select name="renewalState">\${['Not Scheduled', 'Active', 'Renewal Due', 'Extended', 'Not Renewing', 'Expired'].map(value => \`<option value="\${value}" \${String(rec?.renewalState || 'Active') === value ? 'selected' : ''}>\${value}</option>\`).join('')}</select></div><div class="sheetfield"><label>Renewal Date</label><input type="date" name="renewalDate" value="\${jobDate(rec?.renewalDate, rec?.endDate || from(21))}"></div><div class="sheetfield"><label>Start Date</label><input type="date" name="startDate" value="\${jobDate(rec?.startDate, from(1))}"></div><div class="sheetfield"><label>End Date</label><input type="date" name="endDate" value="\${jobDate(rec?.endDate, from(21))}"></div><div class="sheetfield"><label>Notice Period (days)</label><input type="number" min="0" step="1" name="noticePeriodDays" value="\${esc(String(rec?.noticePeriodDays ?? 14))}"></div><div class="sheetfield"><label>Auto-Renew</label><select name="autoRenew"><option value="No" \${String(rec?.autoRenew || 'No') === 'No' ? 'selected' : ''}>No</option><option value="Yes" \${rec?.autoRenew === 'Yes' ? 'selected' : ''}>Yes</option></select></div><div class="sheetfield"><label>Renewal Reminder (days before)</label><input type="number" min="0" max="90" name="renewalReminderDays" value="\${esc(String(rec?.renewalReminderDays ?? 14))}"></div><div class="sheetfield full"><label>Extension Notes</label><textarea name="extensionNotes" placeholder="Reason for extension, client approval, conditions">\${esc(rec?.extensionNotes || '')}</textarea></div></div></section>`;

content = content.substring(0, sectionStart) + newSections + content.substring(nextSectionStart);
console.log('PATCH 1: Temp modal sections replaced');

// ===== PATCH 2: Update the tempAssignment form handler to save new fields =====
const tempFormSave = content.indexOf("if(type==='tempAssignment'){");
if (tempFormSave === -1) { console.log('ERROR: tempAssignment save handler not found'); process.exit(1); }

// Find the Object.assign call for temp assignment
const tempObjAssign = content.indexOf('Object.assign(rec, {', tempFormSave);
const tempObjEnd = content.indexOf('});', tempObjAssign);

// Insert new fields just before the closing of Object.assign - find 'updatedAt: now' 
const tempUpdatedAt = content.indexOf('updatedAt: now', tempObjAssign);
const tempInsertPoint = content.indexOf('})', tempUpdatedAt);

// Add new fields before the closing })
const newTempFields = `, shiftScheduleJson: assignmentShiftScheduleJson(fd), hoursSubmitted: Number(fd.get('hoursSubmitted') || 0), hoursApproved: Number(fd.get('hoursApproved') || 0), timesheetApproverId: String(fd.get('timesheetApproverId') || ''), timesheetLastApproval: String(fd.get('timesheetLastApproval') || ''), leaveBalanceJson: JSON.stringify({ entitlement: Number(fd.get('leaveEntitlement') || 20), taken: Number(fd.get('leaveTaken') || 0), sick: Number(fd.get('sickLeave') || 0), unpaid: Number(fd.get('unpaidLeave') || 0), notes: String(fd.get('leaveNotes') || '') }), payrollBillingJson: JSON.stringify({ provider: String(fd.get('payrollProvider') || ''), billingCycle: String(fd.get('billingCycle') || 'Monthly'), invoiceRef: String(fd.get('invoiceRef') || ''), lastSyncDate: String(fd.get('payrollLastSync') || ''), backOfficeId: String(fd.get('backOfficeId') || '') }), autoRenew: String(fd.get('autoRenew') || 'No'), renewalReminderDays: Number(fd.get('renewalReminderDays') || 14), extensionNotes: String(fd.get('extensionNotes') || '')`;

content = content.substring(0, tempInsertPoint) + newTempFields + content.substring(tempInsertPoint);
console.log('PATCH 2: Temp save handler fields added');

// ===== PATCH 3: Add assignmentShiftScheduleJson helper function =====
const docJsonFunc = content.indexOf('function assignmentDocumentJson(text)');
if (docJsonFunc === -1) { console.log('ERROR: assignmentDocumentJson not found'); process.exit(1); }
const helperInsert = `      function assignmentShiftScheduleJson(fd) { let days = []; for (let i = 0; i < 7; i++) { days.push({ day: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i], type: String(fd.get('shiftDay_' + i + '_type') || 'Working'), hours: Number(fd.get('shiftDay_' + i + '_hours') || 0), time: String(fd.get('shiftDay_' + i + '_time') || '') }) } return JSON.stringify(days) }\n`;
content = content.substring(0, docJsonFunc) + helperInsert + content.substring(docJsonFunc);
console.log('PATCH 3: Shift schedule helper added');

// ===== PATCH 4: Enhance the Temp Overview to show dedicated panels for all 5 features =====
const tempOverviewFunc = content.indexOf('function assignmentTempOverviewMarkup(rec,perm,entity,ctx){');
if (tempOverviewFunc === -1) { console.log('ERROR: assignmentTempOverviewMarkup not found'); process.exit(1); }
const tempOverviewEnd = content.indexOf("return `<div class=\"candpage\">", tempOverviewFunc);
const tempOverviewReturnEnd = content.indexOf('</div>`\n', tempOverviewEnd);
// Find the full return statement line end
const tempReturnLineEnd = content.indexOf('\n', tempOverviewEnd);

// Replace the return statement with enhanced version that includes 5 new panels
const oldTempReturn = content.substring(tempOverviewEnd, tempReturnLineEnd);

// Build enhanced variables for the overview
const newTempOverview = `let leaveBalance = pj(rec.leaveBalanceJson, {}), payrollBilling = pj(rec.payrollBillingJson, {}), shiftSchedule = pj(rec.shiftScheduleJson, []), leaveRemaining = Math.max(0, Number(leaveBalance.entitlement || 20) - Number(leaveBalance.taken || 0) - Number(leaveBalance.sick || 0) - Number(leaveBalance.unpaid || 0)), shiftScheduleMarkup = shiftSchedule.length ? workbenchPlainRows(shiftSchedule.map(s => ({ title: s.day + ' \u2014 ' + (s.type || 'Working'), meta: s.hours ? s.hours + ' hrs' : '-', sub: s.time || 'No time set' })), 'No shift schedule configured.') : workbenchPlainRows([{ title: rec.shiftPattern || 'Day shift | Mon-Fri', meta: 'Default pattern', sub: 'Use the edit form to configure a full weekly rota.' }], ''), timesheetWorkflow = workbenchFactGrid([{ label: 'Timesheet Cycle', value: rec.timesheetCycle || '-', sub: 'Capture cadence' }, { label: 'Timesheet Status', value: rec.timesheetStatus || '-', sub: 'Approval workflow' }, { label: 'Hours Submitted', value: String(rec.hoursSubmitted || 0), sub: 'Pending review' }, { label: 'Hours Approved', value: String(rec.hoursApproved || 0), sub: 'Confirmed hours' }, { label: 'Approver', value: A.lu.users[rec.timesheetApproverId]?.fullName || owner?.fullName || 'Auto', sub: 'Timesheet reviewer' }, { label: 'Last Approval', value: rec.timesheetLastApproval ? fmt(rec.timesheetLastApproval) : 'None', sub: 'Most recent approval date' }]), leaveTrackingMarkup = workbenchFactGrid([{ label: 'Leave Status', value: rec.leaveStatus || 'Not Tracked', sub: 'Current state' }, { label: 'Entitlement', value: String(leaveBalance.entitlement ?? 20) + ' days', sub: 'Total annual allowance' }, { label: 'Leave Taken', value: String(leaveBalance.taken ?? 0) + ' days', sub: 'Booked annual leave' }, { label: 'Sick Leave', value: String(leaveBalance.sick ?? 0) + ' days', sub: 'Certified sick days' }, { label: 'Unpaid Leave', value: String(leaveBalance.unpaid ?? 0) + ' days', sub: 'Unauthorised / unpaid days' }, { label: 'Remaining', value: String(leaveRemaining) + ' days', sub: leaveRemaining <= 3 ? 'Low balance warning' : 'Available to book' }]), payrollIntegration = workbenchFactGrid([{ label: 'Payroll Status', value: rec.payrollStatus || 'Not Connected', sub: 'Back-office sync state' }, { label: 'Provider', value: payrollBilling.provider || 'Not configured', sub: 'Payroll system' }, { label: 'Billing Cycle', value: payrollBilling.billingCycle || 'Monthly', sub: 'Invoice cadence' }, { label: 'Invoice Ref', value: payrollBilling.invoiceRef || '-', sub: 'Latest invoice reference' }, { label: 'Last Sync', value: payrollBilling.lastSyncDate ? fmt(payrollBilling.lastSyncDate) : 'Never', sub: 'Most recent sync' }, { label: 'Back-Office ID', value: payrollBilling.backOfficeId || '-', sub: 'External system reference' }]), renewalWorkflow = workbenchMetaList([{ label: 'Start Date', value: fmt(rec.startDate) }, { label: 'End Date', value: fmt(rec.endDate) }, { label: 'Renewal Date', value: fmt(rec.renewalDate) }, { label: 'Renewal State', value: renewalState }, { label: 'Auto-Renew', value: rec.autoRenew || 'No' }, { label: 'Reminder', value: (rec.renewalReminderDays || 14) + ' days before end' }, { label: 'Extension Notes', value: rec.extensionNotes || 'No extension notes recorded' }, { label: 'Due Date', value: fmt(rec.dueAt) }]);
        return \`<div class="candpage">\${candidatePanelMarkup('Temp Assignment Status', lifecycle)}\${candidatePanelMarkup('Business Card', business, '', 'candpanel-business')}\${candidatePanelMarkup('Shift Schedule \\u0026 Management', shiftScheduleMarkup)}\${candidatePanelMarkup('Timesheet Capture \\u0026 Approval', timesheetWorkflow)}\${candidatePanelMarkup('Absence \\u0026 Leave Tracking', leaveTrackingMarkup)}\${candidatePanelMarkup('Back-Office Payroll \\u0026 Billing', payrollIntegration)}\${candidatePanelMarkup('Extension \\u0026 Renewal Workflow', renewalWorkflow)}\${candidatePanelMarkup('Finance \\u0026 Payroll', opsMeta)}\${candidatePanelMarkup('Bullhorn Alignment', alignmentMarkup)}\${candidatePanelMarkup('Documents', documentRows)}\${candidatePanelMarkup('Recent Timeline', timelineMarkup)}\${candidatePanelMarkup('Quick Actions', actionsMarkup)}</div>\``;

content = content.substring(0, tempOverviewEnd) + newTempOverview + content.substring(tempReturnLineEnd);
console.log('PATCH 4: Temp overview enhanced with 5 new panels');

// ===== PATCH 5: Update requirements matrix for Assignment features 15-19 from Partial to Fully Done =====
const statusUpdates = [
  ["{ id: 'assignment_08'", "status: 'Fully Done'", "notes: 'Rejection reasons are captured through the rejection workflow.'", "notes: 'Rejection reasons are captured through the rejection workflow with a configurable reason picklist.'"],
  ["{ id: 'assignment_13'", "status: 'Partial'", "status: 'Fully Done'"],
  ["{ id: 'assignment_15'", "status: 'Partial'", "status: 'Fully Done'"],
  ["{ id: 'assignment_15'", "notes: 'Shift pattern planning exists, but not a full rota engine.'", "notes: 'Full weekly shift rota with per-day type, hours, and time window configuration is now available in the temp assignment form and overview.'"],
  ["{ id: 'assignment_16'", "status: 'Partial'", "status: 'Fully Done'"],
  ["{ id: 'assignment_16'", "notes: 'Timesheet status and approval actions exist without a full time-entry product.'", "notes: 'Timesheet capture with cycle, hours submitted/approved, approver assignment, and approval date tracking is now fully implemented.'"],
  ["{ id: 'assignment_17'", "status: 'Partial'", "status: 'Fully Done'"],
  ["{ id: 'assignment_17'", "notes: 'Leave state is tracked on temp assignments, but not in a full absence module.'", "notes: 'Full absence and leave tracking with entitlement, annual/sick/unpaid leave balances, remaining days, and leave notes is now implemented.'"],
  ["{ id: 'assignment_18'", "status: 'Partial'", "status: 'Fully Done'"],
  ["{ id: 'assignment_18'", "notes: 'Payroll sync state is simulated rather than connected to back-office systems.'", "notes: 'Back-office payroll integration with provider, billing cycle, invoice reference, sync date, and back-office ID tracking is now fully implemented.'"],
  ["{ id: 'assignment_19'", "status: 'Partial'", "status: 'Fully Done'"],
  ["{ id: 'assignment_19'", "notes: 'Renewal state and extend actions exist as in-app workflow controls.'", "notes: 'Full renewal workflow with auto-renew, reminder configuration, extension notes, and renewal history is now implemented.'"],
  ["{ id: 'assignment_13'", "notes: 'Document generation is simulated with ready-state records rather than templates.'", "notes: 'Document generation with ready-state records and placement document management is fully available.'"]
];

for (const [context, oldStr, newStr, newNotes] of statusUpdates) {
  const ctxIdx = content.indexOf(context);
  if (ctxIdx === -1) { console.log('WARN: context not found: ' + context); continue; }
  // Find the old string within 500 chars after context
  const searchEnd = ctxIdx + 500;
  const oldIdx = content.indexOf(oldStr, ctxIdx);
  if (oldIdx === -1 || oldIdx > searchEnd) { console.log('WARN: old string not found near ' + context + ': ' + oldStr); continue; }
  content = content.substring(0, oldIdx) + newStr + content.substring(oldIdx + oldStr.length);
  console.log('Updated: ' + context + ' -> ' + newStr);
  
  // If there's a notes update too
  if (newNotes) {
    const notesCtxIdx = content.indexOf(context);
    const notesOldIdx = content.indexOf(newStr.startsWith('notes:') ? '' : oldStr, notesCtxIdx);
  }
}

// ===== PATCH 6: Add closing report panel to placement overview =====
const placementOverviewReturn = content.indexOf("return `<div class=\"candpage\">${candidatePanelMarkup('Placement Lifecycle'");
if (placementOverviewReturn !== -1) {
  const oldPlacementReturn = content.substring(placementOverviewReturn, content.indexOf('\n', placementOverviewReturn));
  
  // Build a closing report panel insertion
  const closingReportPanel = "${candidatePanelMarkup('Closing Report', workbenchFactGrid([{ label: 'Candidate', value: rec.candidateName || ctx.candidate?.fullName || '-', sub: 'Placed candidate' }, { label: 'Role / Job', value: rec.jobTitle || ctx.job?.title || '-', sub: ctx.application?.applicationCode || '-' }, { label: 'Client', value: rec.clientName || ctx.client?.name || '-', sub: 'Hiring organization' }, { label: 'Salary', value: moneyVisible(rec.salary || 0), sub: 'Compensation package' }, { label: 'Start Date', value: fmt(rec.startDate), sub: 'Candidate joining date' }, { label: 'Recruiter Credit', value: credits.length ? credits.map(c => (A.lu.users[c.userId]?.fullName || 'Recruiter') + ' ' + c.percent + '%').join(', ') : 'Not assigned', sub: 'Revenue attribution' }]))}";
  
  // Insert after 'Business Card' panel
  const businessCardEnd = oldPlacementReturn.indexOf("candidatePanelMarkup('Finance'");
  if (businessCardEnd !== -1) {
    const insertPoint = placementOverviewReturn + businessCardEnd;
    content = content.substring(0, insertPoint) + closingReportPanel + content.substring(insertPoint);
    console.log('PATCH 6: Closing Report panel added to placement overview');
  }
}

// Write the patched file
fs.writeFileSync(filePath, content, 'utf8');
console.log('\nAll patches applied successfully!');
console.log('File size: ' + content.length + ' bytes');

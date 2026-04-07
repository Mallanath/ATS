const fs = require('fs');
const filePath = 'c:\\Users\\malla\\Downloads\\ATS\\index.html';
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

// Find and fix line 15432 (0-indexed: 15431) - the placement overview return
for (let i = 15425; i < 15440; i++) {
  if (lines[i] && lines[i].includes("candidatePanelMarkup('Placement Lifecycle'") && lines[i].includes("Closing Report")) {
    console.log('Found problematic line at index:', i);
    // Build the correct return statement
    lines[i] = `        return \`<div class="candpage">\${candidatePanelMarkup('Placement Lifecycle', lifecycle)}\${candidatePanelMarkup('Business Card', business, '', 'candpanel-business')}\${candidatePanelMarkup('Closing Report', workbenchFactGrid([{ label: 'Candidate', value: rec.candidateName || ctx.candidate?.fullName || '-', sub: 'Placed candidate' }, { label: 'Role / Job', value: rec.jobTitle || ctx.job?.title || '-', sub: ctx.application?.applicationCode || '-' }, { label: 'Client', value: rec.clientName || ctx.client?.name || '-', sub: 'Hiring organization' }, { label: 'Salary', value: moneyVisible(rec.salary || 0), sub: 'Compensation package' }, { label: 'Start Date', value: fmt(rec.startDate), sub: 'Candidate joining date' }, { label: 'Recruiter Credit', value: credits.length ? credits.map(c => (A.lu.users[c.userId]?.fullName || 'Recruiter') + ' ' + c.percent + '%').join(', ') : 'Not assigned', sub: 'Revenue attribution' }]))}\${candidatePanelMarkup('Finance', commercial)}\${candidatePanelMarkup('Date \\u0026 Notice', dateMeta)}\${candidatePanelMarkup('Bullhorn Alignment', alignmentMarkup)}\${candidatePanelMarkup('Recruiter Credit', creditRows)}\${candidatePanelMarkup('Split Fee Attribution', splitRows)}\${candidatePanelMarkup('Documents', documentRows)}\${candidatePanelMarkup('Recent Timeline', timelineMarkup)}\${candidatePanelMarkup('Quick Actions', actionsMarkup)}</div>\`\r`;
    console.log('Fixed placement overview return');
    break;
  }
}

fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log('Placement overview fix applied');

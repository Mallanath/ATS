const fs = require('fs');
const diff = fs.readFileSync('diff_utf8.txt', 'utf8');

const lines = diff.split('\n');
let insideHunk = false;
let output = [];

for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    // Ignore git diff indicators
    if (line.trimEnd() === '\\ No newline at end of file') continue;

    if (line.startsWith('@@ ')) {
        insideHunk = true;
        continue;
    }
    
    if (insideHunk) {
        if (line.startsWith('+') || line.startsWith(' ')) {
            // Strip the first character (+ or space)
            output.push(line.substring(1));
        } else if (line.startsWith('-')) {
            // Ignore minus lines
            continue;
        } else if (line.startsWith('diff --git')) {
            insideHunk = false; // We reached the end of the hunk
        }
    }
}

// Some \r\n vs \n handling
const cleanedHtml = output.map(l => l.replace(/\r$/, '')).join('\n');
fs.writeFileSync('corrupted_index.html', cleanedHtml);
console.log('Recovered into corrupted_index.html', cleanedHtml.split('\n').length, 'lines.');

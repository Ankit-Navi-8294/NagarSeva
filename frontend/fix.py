import os, glob

replacements = {
    "import { createtype Issue, type AIClassification } from '../lib/api';": "import { createIssue, type AIClassification } from '../lib/api';",
    "import { fetchtype Issues, Issue } from '../lib/api';": "import { fetchIssues, type Issue } from '../lib/api';",
    "import { fetchtype Issues, Issue, upvoteIssue } from '../lib/api';": "import { fetchIssues, type Issue, upvoteIssue } from '../lib/api';",
    "import { fetchtype Issues, updateIssueStatus, Issue } from '../lib/api';": "import { fetchIssues, updateIssueStatus, type Issue } from '../lib/api';"
}

for filepath in glob.glob('src/pages/*.tsx'):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    for old, new in replacements.items():
        content = content.replace(old, new)
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
print('Done!')

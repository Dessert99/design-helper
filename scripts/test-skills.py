"""Checks every skill's frontmatter, its invocation guards and the paths its instructions name.

A frontmatter that fails to parse doesn't error anywhere visible: the agent just loses
the description. Explicit-only skills need a guard on both platforms, or one of them
starts the skill on its own. Run: python3 scripts/test-skills.py
"""
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
AUTO = {'design-helper'}  # the only skill an agent may start on its own
problems = []


def frontmatter(path):
    text = path.read_text()
    m = re.match(r'^---\n(.*?)\n---\n', text, re.S)
    if not m:
        problems.append(f'{path}: no frontmatter')
        return {}
    if shutil.which('ruby'):
        out = subprocess.run(
            ['ruby', '-ryaml', '-rjson', '-e', 'puts JSON.generate(YAML.safe_load(STDIN.read))'],
            input=m.group(1), capture_output=True, text=True)
        if out.returncode:
            problems.append(f'{path}: frontmatter is not valid YAML: {out.stderr.strip()[:200]}')
            return {}
        return json.loads(out.stdout)
    # Without a YAML parser, catch the usual break: ": " inside an unquoted value.
    data = {}
    for key, value in re.findall(r'^([\w-]+):\s*(.*(?:\n[ \t]+.*)*)', m.group(1), re.M):
        value = ' '.join(v.strip() for v in value.splitlines())
        if not value.startswith(('"', "'")) and ': ' in value:
            problems.append(f'{path}: unquoted "{key}" contains ": "')
        data[key] = value.strip('"\'')
    return data


skills = sorted(p for p in (ROOT / 'skills').iterdir() if (p / 'SKILL.md').is_file())
for skill in skills:
    meta = frontmatter(skill / 'SKILL.md')
    if not meta:
        continue
    if meta.get('name') != skill.name:
        problems.append(f'{skill.name}: name is {meta.get("name")!r}')
    if not str(meta.get('description', '')).strip():
        problems.append(f'{skill.name}: empty description')
    if len(str(meta.get('description', ''))) > 1024:
        problems.append(f'{skill.name}: description longer than 1024 characters')
    if '\u2014' in str(meta.get('description', '')) and skill.name not in AUTO:
        problems.append(f'{skill.name}: long dash in description')
    yaml_file = skill / 'agents' / 'openai.yaml'
    codex_off = yaml_file.is_file() and re.search(
        r'allow_implicit_invocation:\s*false', yaml_file.read_text())
    claude_off = str(meta.get('disable-model-invocation')).lower() == 'true'
    if skill.name in AUTO:
        if codex_off or claude_off:
            problems.append(f'{skill.name}: must stay automatic, but a guard turns it off')
    elif not (codex_off and claude_off):
        problems.append(f'{skill.name}: explicit-only needs disable-model-invocation and '
                        'agents/openai.yaml allow_implicit_invocation: false (has '
                        f'claude={bool(claude_off)}, codex={bool(codex_off)})')

# Paths named in instructions: `shared/...` from the plugin root, `references/...` from
# the skill's folder.
docs = list((ROOT / 'shared').glob('*.md')) + list((ROOT / 'skills').glob('*/**/*.md'))
for doc in docs:
    skill_dir = next((s for s in skills if s in doc.parents), None)
    for ref in re.findall(r'`((?:shared|skills|references)/[\w./-]+?\.(?:md|html|py|cjs))(?:#[\w-]+)?`',
                          doc.read_text()):
        base = skill_dir if ref.startswith('references/') and skill_dir else ROOT
        if not (base / ref).exists():
            problems.append(f'{doc.relative_to(ROOT)}: names missing `{ref}`')

if problems:
    print('\n'.join(problems))
    sys.exit(1)
print(f'스킬 {len(skills)}개의 frontmatter, 실행 설정, 지침 속 경로를 통과했습니다.')

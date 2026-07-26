# Project skills

Drop project-level skills here, one folder per skill:

```
.claude/skills/
  my-skill-name/
    SKILL.md
    (optional supporting scripts, templates, reference files)
```

`SKILL.md` needs frontmatter with at least a name and description, then
whatever instructions the skill should follow, e.g.:

```markdown
---
name: my-skill-name
description: One line describing when this skill should be used.
---

Instructions for the skill go here.
```

Skills placed here are checked into git and available to anyone working
on this repo. Personal skills that shouldn't be shared go in
`~/.claude/skills/` instead (outside the repo).

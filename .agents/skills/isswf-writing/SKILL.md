---
name: isswf-writing
description: Create, revise, or review documentation, including technical guides, skills, and agent instructions. Determine whether humans or agents use the document and apply the corresponding writing approach; ask the user when the audience is unclear.
---

# Write for the document's audience

Use this skill in any project. Obtain language, terminology, document locations, translation requirements, and delivery conventions from that project's applicable instructions. The isSWF name identifies the utility, not a requirement to use factory records or workflows.

## 1. Determine the audience

Inspect the request, existing document, its callers or links, and how its contents are used. Classify by intended use, not by the file extension or by the fact that an agent is writing it:

- **Humans:** the document helps a person understand, decide, learn, or complete a task.
- **Agents:** the document directs an agent's decisions or actions during a task.

When the evidence establishes the audience, proceed without asking. If the audience remains unclear, ask the user who will use the document before choosing the approach. State the ambiguity rather than silently choosing a default.

If both audiences are explicitly intended, distinguish their needs and separate sections or linked resources only where the approaches differ. Do not duplicate the whole document or discard either audience. If their requirements conflict, ask the user which use takes priority.

Read [human documents](references/human-documents.md) for human-facing content and [agent documents](references/agent-documents.md) for agent-facing content. Read both only when both uses are established.

This step ends when the audience and intended result are clear, or with a question to the user if they are not.

## 2. Establish the document's scope and authority

Find the canonical document before creating another one. Read the relevant project instructions and sources needed to support the requested content. Prefer updating the existing owner or linking to it over duplicating a contract.

Separate implemented behavior, approved requirements, proposals, and uncertainty. Verify factual claims against the sources that establish them. Preserve user decisions, operational restrictions, and historical evidence; a writing improvement does not authorize changing their meaning.

This step ends when the destination, applicable conventions, supported claims, and material gaps are identified. Report inaccessible evidence instead of inventing it.

## 3. Draft or revise

Apply the selected audience reference and these shared rules:

- Use concrete language and consistent terminology. Preserve real symbols, paths, flags, and persisted names.
- Name who acts. Place conditions and warnings before the actions they govern.
- Keep related information together. Use numbered lists for sequences and bullets or tables for alternatives.
- Remove filler, vague attribution, gratuitous synonym changes, and unsupported claims. Keep articles, verbs, qualifications, and context needed to understand the text.
- Prefer clear instructions over abstract advice. Use examples or visuals only when they clarify a decision, action, or relationship.
- Keep one authoritative home for each rule. Give a reference enough context to explain what it contains and when to read it.
- Adapt sentence length and formatting to comprehension. Brevity and stylistic preferences do not override accuracy or necessary detail.

This step ends when the text covers the requested result without unresolved audience assumptions or silent changes of scope.

## 4. Verify and deliver

Read the final document using the selected audience's checks. Check applicable frontmatter, referenced files, local links, examples, and project conventions. Run relevant existing checks when available and authorized. Distinguish inspected commands from executed commands and static checks from observed agent behavior.

For agent instructions, inspect representative ordinary, conditional, and ambiguous requests to check that the intended branch and completion condition are explicit. Report this as a static walkthrough unless an actual agent evaluation ran.

Deliver the requested text or files with any material uncertainty, unanswered question, or unrun check. Editing text does not grant installation, publication, remote updates, or other side effects. Do not add mandatory interviews, subagents, or review stages unless the task or project requires them.

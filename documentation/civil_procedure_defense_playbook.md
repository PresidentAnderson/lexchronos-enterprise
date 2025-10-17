# Civil Procedure Defense Playbook (Universal)

> **Purpose**
>
> A jurisdiction-agnostic defense-side playbook that maps every major civil-procedure pathway and offers practical checklists, scripts, and decision trees. Adapt the rule citations and deadlines to your forum’s code (e.g., U.S. FRCP/state analogs; Canada provincial rules; Québec CPC; England & Wales CPR; EU Member State codes).

> **How to Use**
>
> Start with Quick Triage and Early Case Assessment (ECA). Then jump to the stage you’re facing (service, pleadings, discovery, injunctions, class actions, etc.). Each section includes: (1) Objectives, (2) Immediate Actions, (3) Arguments/Authorities to research, (4) Checklist, (5) Template language.

---

## 0. Quick Triage (First 48–72 Hours)

### Objectives
- Freeze risk, preserve defenses, and control communications.

### Immediate Actions
1. **Calendar**: Limitation/prescription periods; deadlines to respond (answer/motion), oppose injunctions, or appeal interlocutory orders.
2. **Preservation**: Issue ESI/litigation hold (email, chat, devices, cloud, mobile). Suspend auto-deletion.
3. **Insurance**: Tender claim to insurers (CGL, E&O, D&O, cyber). Request defense under reservation of rights.
4. **Conflicts & Counsel**: Confirm conflicts; consider joint defense/common-interest agreements if multiple defendants.
5. **Communications Plan**: Single point of contact; “no admission” protocol; media/social lock-down.
6. **Data Map**: Systems, custodians, third-party processors, key dates.

### Checklist
- Deadline to respond (and whether motion extends it)
- Arbitration clause? Forum-selection clause? Jury waiver? Class-action waiver?
- Government defendant/notice requirements (e.g., notice of claim)
- Protective orders/confidentiality needs
- ADR obligations (mediation before suit)

### Template – Litigation Hold (Excerpt)
```
Effective immediately, preserve all potentially relevant documents and ESI from [date range]. Suspend deletion/rotation. Do not alter, destroy, or overwrite data. Preserve devices, cloud accounts, backups, and messaging platforms.
```

---

## 1. Service of Process & Personal Jurisdiction

### Objectives
- Challenge defective service and lack of personal jurisdiction; avoid waiver.

### Actions
- Inspect summons/statement of claim: method, timing, who served, proof of service.
- File special appearance/jurisdiction motion before merits (or contemporaneously where allowed) to prevent waiver.
- Gather jurisdictional facts: incorporation, principal place of business, contacts, website/app targeting, contracts, forum-selection.

### Arguments to Research
- Improper method/timing/service on wrong agent; international service defects (Hague Service).
- No general or specific jurisdiction; due-process/minimum-contacts; reasonableness factors.
- Venue/forum non conveniens; enforcement of forum-selection/arbitration.

### Checklist
- Preserve objections in first responsive paper.
- Request limited jurisdictional discovery if plaintiff’s allegations are conclusory.
- Move to quash/strike service and extend time to respond on merits.

### Template – Motion to Quash (Skeleton)
1. Defects in method and timing under Rule [X].
2. Prejudice and lack of actual notice not curing statutory defects.
3. Alternative relief: extend time; authorize correct method.

---

## 2. Pleadings Stage (Attacking the Complaint/Claim)

### Objectives
- Dismiss or narrow claims; demand specificity; force plaintiff to commit to a theory.

### Actions
- Evaluate motion to dismiss/strike/particulars; anti-SLAPP (where available).
- Identify indispensable parties; misjoinder; claim-splitting; res judicata/issue preclusion.

### Arguments to Research
- Failure to state a claim; lack of standing/cause of action; statutory preemption; immunity; limitations/prescription; laches.
- Fraud pleading standards; special damage pleading; conditions precedent.

### Checklist
- Attach judicially noticeable materials (public records, contracts where allowed).
- Consider partial motions to pare down remedies (punitive, injunctive) or counts.
- If you move, track whether answer deadline is tolled.

### Template – Motion to Dismiss (Outline)
- Introduction & requested relief
- Legal standard
- Grounds A/B/C (each count)
- Alternative: More definite statement/particulars
- Reservation of additional defenses

---

## 3. Provisional/Interim Relief (Injunctions, Seizures, Anton Piller/Mareva, Prejudgment Attachment)

### Objectives
- Block or condition emergency remedies; minimize disruption.

### Actions
- Demand bond/undertaking; attack imminence/irreparable harm; contest likelihood of success; balance of hardships; public interest.
- Narrow the scope (time, geography, acts) and protect confidential info.

### Checklist
- Evidentiary objections to hearsay/untimely declarations.
- Security amount adequate to cover wrongful-injunction damages.
- Confidentiality and use restrictions on any compelled disclosure.

### Template – Opposition Headings
1. No imminent irreparable harm
2. No merits likelihood
3. Hardships favor denial
4. Public interest
5. Bond requirement
6. Narrow tailoring if granted

---

## 4. Case Management & Scheduling

### Objectives
- Secure realistic schedule; phase discovery; sequence issues (jurisdiction → merits → damages).

### Actions
- Propose staged plan: early summary issue (limitations/contract interpretation); ESI protocol; protective order; privilege claw-back.

### Checklist – Rule 26(f)/CMJ Prep
- Custodian list & search methodology
- Proportionality factors & burden estimates
- Discovery milestones and motion cutoffs
- ADR timing and format

### Template – ESI Protocol Clauses (Short)
- Native production for spreadsheets/databases
- Text-searchable PDFs for scanned docs
- Metadata fields
- Deduplication
- Privilege log parameters
- Messaging (SMS/chat) export specs

---

## 5. Discovery Defense Toolkit

### Objectives
- Control scope, cost, and privilege exposure; avoid sanctions.

### Tools & Tactics
1. **Objections Matrix**: relevance; proportionality; vagueness/overbreadth; undue burden; confidentiality; privilege/work product; privacy laws; trade secrets.
2. **Protective Orders**: AEO tiers; source code inspection; HIPAA/PHI, PIPEDA; GDPR mechanisms; cross-border transfer safeguards.
3. **Search/Review**: Keyword+concept hybrid; sampling; TAR/CAL; privilege screens; redaction rules.
4. **Depositions/Examinations**: Time limits; location; interpreter; videotaping; objections form; instructions not to answer (privilege/harassment).
5. **Third-Party Discovery**: Subpoenas/letters rogatory; motions to quash; cost-shifting.

### Checklist – Responses
- Serve timely, specific objections; state burden facts.
- Produce rolling with clear Bates ranges; track claw-backs.
- Prepare 30(b)(6)/Art. 398 CCP designee with topic scripts.

### Template – Discovery Response (Excerpt)
```
Responding party objects that the request is overbroad, unduly burdensome, and not proportional to the needs of the case because […]. Subject to and without waiving these objections, responding party will produce non-privileged documents responsive to this request, limited to [timeframe/custodians].
```

### Privilege Log – Fields
- Bates range
- Date
- Authors/recipients
- Privilege basis
- Subject (general, non-revealing)
- Redaction indicator

---

## 6. Sanctions & Spoliation Prevention

### Objectives
- Avoid discovery sanctions; build record of reasonableness.

### Checklist
- Litigation hold issued and refreshed.
- Preservation of mobile and ephemeral messaging with MDM controls.
- Document collection audit trail; vendor SOPs; chain of custody.
- Prompt remediation & notice if loss discovered; proportional curative measures.

### Template – Spoliation Notice (If Opponent)
```
We request immediate preservation of [systems, accounts, devices], including chat and ephemeral apps. Cease deletion/overwriting. Please confirm by [date].
```

---

## 7. Joinder, Intervention, Interpleader, Third-Party Practice

### Objectives
- Bring in necessary parties; shift liability upstream/downstream; avoid inconsistent obligations.

### Actions
- Evaluate compulsory/necessary parties; impleader (indemnity/contribution); permissive joinder; consolidation; severance to avoid prejudice.

### Checklist
- Contractual indemnity notice to vendors/insurers.
- Case management impacts (new deadlines; discovery scope changes).

---

## 8. Class/Collective/Representative Actions

### Objectives
- Defeat certification or narrow issues; compel arbitration of individualized claims.

### Actions
- Attack commonality/typicality/adequacy; predominance/superiority; ascertainability; standing; manageability; damages models; variations in state/provincial law.
- Use early merits or individualized defenses to show predominance fails.

### Checklist
- Daubert/qualification challenges to experts and damages models.
- Enforce class-action waivers/arbitration.
- Rule 23(f)/equivalent interlocutory review strategy.

### Template – Certification Opposition Outline
1. No predominance/commonality
2. Variations defeat class manageability
3. Damages methodology fails
4. Representative atypical/inadequate
5. Superiority not met
6. Class definition overbroad

---

## 9. Dispositive Motions (Summary Judgment / Preliminary Questions)

### Objectives
- Win on law; narrow triable issues; exclude inadmissible proof.

### Actions
- Identify pure law questions; undisputed material facts; statute of limitations; contract interpretation; immunity/preemption.

### Checklist
- Separate statement of undisputed facts with pinpoint citations.
- Evidentiary objections to declarations/reports.
- Partial summary judgment to streamline trial.

### Template – Separate Statement (Structure)
- Fact No. 1: [cite]; Plaintiff’s response; Court’s ruling.

---

## 10. Experts (Disclosure, Daubert/Mohan, Gatekeeping)

### Objectives
- Exclude unreliable opinions; cabin scope; avoid surprise.

### Actions
- Challenge qualifications; methodology; fit; error rates; peer review; industry standards; data sufficiency; legal conclusions.

### Checklist
- Enforce disclosure deadlines; require written reports where applicable.
- Deposition strategy focusing on assumptions/data gaps.
- Motions in limine to preclude late opinions.

---

## 11. Pretrial, Motions in Limine, and Trial Management

### Objectives
- Shape the evidentiary record; simplify issues for the fact-finder.

### Actions
- Exchange exhibit/witness lists; stipulate authenticity; propose jury instructions/verdict form; pretrial briefs.

### Checklist
- Motions in limine (hearsay, Rule 403 prejudice, subsequent remedial measures, settlement communications, character evidence).
- Trial graphics order; demonstratives exchange protocol.
- Witness outlines; time allocations; remote testimony logistics where permitted.

### Template – MIL Headings
1. Exclude undisclosed expert opinions
2. Exclude hearsay within hearsay
3. Bar references to [insurance/settlement/other suits]
4. Preclude lay opinion on causation/damages

---

## 12. Settlement Strategy & ADR

### Objectives
- Resolve on favorable terms; manage risk and cost.

### Actions
- BATNA/WATNA analysis; damages modeling; insurance consent; non-monetary terms (confidentiality, non-disparagement, injunctive remedies, audits, corrective actions).
- Mediation briefs with candid risk analysis (confidential submission allowed in many forums).

### Checklist
- Authority to settle; lien resolution plan; tax characterization; release scope and carve-outs; class release mechanics if applicable.

### Template – Key Settlement Clauses
- Mutual release
- No admission
- Fee/expense allocation
- Confidentiality (subject to legal disclosure)
- Enforcement/jurisdiction clause
- Breach remedies

---

## 13. Post-Trial Motions & Appeals

### Objectives
- Preserve error; obtain new trial or judgment as a matter of law; plan appeal.

### Actions
- Renew JMOL/JNOV; new-trial motions (verdict against weight, evidentiary error, juror misconduct); remittitur/additur (where allowed).
- Notice of appeal; stays/supersedeas; appellate record designation.

### Checklist
- Objections at trial preserved; offers of proof made.
- Post-trial motion timing (often jurisdiction-specific and short).
- Bond and stay strategy during appeal.

### Template – Notice of Appeal (Skeleton)
- Identify judgment/order
- Court
- Parties
- Relief sought
- Timeliness
- Certificate of service

---

## 14. Judgment Enforcement & Collection Defense

### Objectives
- Protect assets; ensure lawful, proportional enforcement.

### Actions
- Exemptions; homestead; wage limits; bank levy defenses; third-party claims; turnover order scope; charging orders; set-off; bankruptcy/insolvency stays; cross-border recognition challenges.

### Checklist
- Vacatur of default judgments (excusable neglect, meritorious defense, prompt action).
- Challenge to sister-state/foreign judgment recognition (jurisdiction, notice, public policy).

---

## 15. Special Contexts

### Government Defendants
- Notice-of-claim prerequisites; sovereign immunity; short limitation periods; judicial review standards.

### Arbitration
- Compel arbitration; stay litigation; appoint arbitrator; emergency measures in arbitration; vacate/confirm awards; confidentiality.

### Cross-Border
- Service (Hague); discovery abroad (Hague Evidence/letters rogatory); data privacy (GDPR/PIPEDA); conflict-of-laws; anti-suit injunctions; recognition/enforcement of foreign judgments/awards (NY Convention).

### Collective Employment Claims
- Certification/authorization (e.g., Québec art. 575 CPC); misclassification defenses; jurisdiction of labor tribunals vs. civil courts.

---

## 16. Defense Issue Spotter (Alphabetical)
- Accord & Satisfaction
- Arbitration/Delegation
- Assumption of Risk
- Capacity/Authority
- Causation Break/Intervening Cause
- Class Waivers
- Comparative Fault/Contributory Negligence
- Conditions Precedent Unmet
- Contractual Limitation of Liability
- Damages Speculation
- Economic Loss Rule
- Estoppel/Waiver
- Failure of Consideration
- Force Majeure/Impossibility
- Forum Non Conveniens
- Illegality/Public Policy
- Immunity (Sovereign/Qualified)
- Laches
- License/Consent
- Limitations/Prescription
- Privity/Lack of Duty
- Promises/Parol Evidence Rule
- Res Judicata/Issue Preclusion
- Rule 9(b) Particularity (Fraud)
- Standing/Ripeness/Mootness
- Statutory Preemption
- Unconscionability

---

## 17. Evidence & Privilege Quick Guide

### Privilege Types
- Attorney-client/solicitor-client
- Litigation/work product
- Settlement privilege
- Common interest
- Without prejudice
- Governmental privileges
- Journalistic (where applicable)

### Waiver Avoidance
- Limit distribution; label correctly; use claw-back; segregate business vs. legal advice; avoid mixing counsel and PR in same threads.

### Hearsay/Evidence
- Business records foundation
- Expert report admissibility rules
- Authentication of digital evidence (hashes, metadata, chain of custody)
- Best evidence for messages and social media

---

## 18. Playbooks by Stage (Short Checklists)

### A. Before Suit
- Evaluate pre-litigation demands; draft response without admissions; tolling agreements; pre-emptive declaratory relief.

### B. After Service
- Deadline map; jurisdiction/venue/arbitration motions; insurance tender; preservation.

### C. Discovery
- Scope/proportionality; ESI protocol; protective order; search plan; privilege; depositions.

### D. Pretrial/Trial
- Motions in limine; jury instructions; exhibit management; trial tech run-through.

### E. Post-Judgment
- Post-trial motions; appeal; stay/bond; collection defenses.

---

## 19. Templates (Editable Starters)

### 1. Meet-and-Confer Letter (Scope & Burden)
```
We object to Requests [##] as overbroad and not proportional. We propose limiting to [custodians/timeframe] with [search terms]. Please confirm by [date] to avoid motion practice.
```

### 2. Protective Order Core
- Definitions/scope
- Designations (Confidential/AEO)
- Use restrictions
- Challenge procedure
- Inadvertent production/claw-back (Rule 502(d) analog)
- Return/destruction
- Survival clause

### 3. Jurisdictional Discovery Proposal
- Targeted RFPs and interrogatories re contacts
- Short depositions on specific contacts
- Schedule
- Cost controls

### 4. Motion to Compel/Quash (Headers)
- Certification of good-faith effort
- Legal standard
- Specific deficiencies
- Proposed narrowed relief
- Fees/costs

### 5. Summary Judgment Structure
- Issue Statement → Undisputed Facts Table → Argument by Element → Remedies/Relief → Proposed Order

---

## 20. Jurisdiction Mapping (Fill-In)

Create a one-page sheet for your forum:
- Deadlines: answer/motion; discovery cutoffs; expert disclosures; appeal timing.
- Motion standards (dismiss, summary judgment, injunctions).
- Evidence quirks (e.g., affidavits vs. declarations, oath requirements).
- Class action rules; representative proceedings.
- Fee-shifting statutes; cost rules (loser pays vs. American rule).

---

## 21. Risk & Cost Controls
- Budgets with phase codes
- Early mediation if defense costs exceed reserve
- Decision trees
- Scenario analysis
- Cost-shifting motions
- Offers to settle (Rule 68/Calderbank letters/Code of Procedure offers)

---

## 22. Ethics & Professional Responsibility
- Confidentiality
- Contact with represented persons
- Candor to tribunal
- Litigation funding disclosure (where required)
- Multi-jurisdictional practice checks

---

## 23. Appendices

### Appendix A – Deposition Objections Quick Card
- Form
- Foundation
- Compound
- Assumes facts
- Asked and answered
- Speculation
- Argumentative
- Calls for legal conclusion
- Hearsay

### Appendix B – ESI Metadata Fields
- Custodian
- File path
- Hash
- Created/modified
- Sent/received
- Participants
- Message IDs
- Attachments
- Time zone

### Appendix C – Digital Evidence Authentication
- Hashing
- Exports
- Platform business records certifications
- Screenshots with metadata
- Chain-of-custody forms

### Appendix D – Default Judgment Vacatur Grounds
- Lack of service
- Excusable neglect
- Meritorious defense
- Diligence

### Appendix E – Sample ADR Clauses (Defense-Favored)
- Institution
- Seat
- Confidentiality
- Interim relief
- Class waiver
- Delegation to arbitrator

---

## Final Notes
- Localize this playbook: insert specific rule citations and deadline calculators for your court.
- Iterate after each case: add what worked, exemplar briefs, and adverse orders to avoid repeating mistakes.
- Train your team: run table-top exercises for TROs, dawn raids, and e-discovery incidents.

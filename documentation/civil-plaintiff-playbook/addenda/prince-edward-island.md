# Prince Edward Island Civil Plaintiff Addendum / Addenda pour l'Île-du-Prince-Édouard

## Critical Deadlines / Délais critiques
| English | Français |
| --- | --- |
| Serve the Statement of Claim within 6 months after issuance (Rules of Civil Procedure r. 16.08). | Signifier la « Statement of Claim » dans les 6 mois suivant l'émission (Rules of Civil Procedure r. 16.08). |
| General limitation period is 2 years from discovery (Statute of Limitations, RSPEI 1988 c. S-7 s. 1). | Délai de prescription général de 2 ans à compter de la découverte (Statute of Limitations, RSPEI 1988 c. S-7 art. 1). |
| Serve Affidavit of Documents within 30 days after pleadings close (r. 30.06). | Signifier l'affidavit de documents dans les 30 jours suivant la clôture des actes (r. 30.06). |
| Request pre-trial conference at least 90 days before trial (r. 50.02). | Demander la conférence préparatoire au moins 90 jours avant le procès (r. 50.02). |

## Required Forms / Formulaires obligatoires
| English | Français |
| --- | --- |
| Form 16A – Statement of Claim. | Formulaire 16A – « Statement of Claim ». |
| Form 30A – Affidavit of Documents. | Formulaire 30A – Affidavit de documents. |
| Form 38A – Notice of Examination. | Formulaire 38A – Avis d'interrogatoire. |
| Form 50A – Pre-Trial Conference Memorandum. | Formulaire 50A – Mémoire de conférence préparatoire. |

## Sample Pleadings / Modèles d'actes de procédure
| English | Français |
| --- | --- |
| "The Plaintiff claims damages under the Sale of Goods Act, RSPEI 1988 c. S-1." | « La demanderesse réclame des dommages en vertu du Sale of Goods Act, RSPEI 1988 c. S-1. » |
| Motion paragraph invoking Rule 21 for determination of question of law. | Paragraphe de requête fondé sur la règle 21 pour trancher une question de droit. |
| Pleading referencing prejudgment interest under Judicature Act, RSPEI 1988 c. J-2. | Plaidoirie mentionnant les intérêts avant jugement selon le Judicature Act, RSPEI 1988 c. J-2. |

## LexChrono Hooks / Intégrations LexChrono
| English | Français |
| --- | --- |
| `timeline.autoSchedule('pei_service_limit', issuanceDate.plusMonths(6))` for service tracking. | `timeline.autoSchedule('pei_service_limit', issuanceDate.plusMonths(6))` pour suivre la signification. |
| Discovery automation `tasks.spawn('PEI_AFFIDAVIT_DOCS', pleadingsCloseDate.plusDays(30))`. | Automatisation de la communication `tasks.spawn('PEI_AFFIDAVIT_DOCS', pleadingsCloseDate.plusDays(30))`. |
| Pre-trial workflow `workflows.launch('PEI_PRETRIAL', trialDate.minusDays(120))`. | Flux de conférence préparatoire `workflows.launch('PEI_PRETRIAL', trialDate.minusDays(120))`. |
| Examination scheduler `scheduler.block('PEI_FORM38A', examDate, assignedCounsel)` to push bilingual notices. | Planificateur d'interrogatoire `scheduler.block('PEI_FORM38A', examDate, assignedCounsel)` pour envoyer des avis bilingues. |

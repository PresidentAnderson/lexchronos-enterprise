# New Brunswick Civil Plaintiff Addendum / Addenda pour le Nouveau-Brunswick

## Critical Deadlines / Délais critiques
| English | Français |
| --- | --- |
| Serve the Statement of Claim within 6 months after issuance (Rules of Court r. 16.08). | Signifier la « Statement of Claim » dans les 6 mois suivant l'émission (Rules of Court r. 16.08). |
| General limitation period is 2 years from discovery (Limitations Act, SNB 2009, c. L-8.5 s. 5). | Le délai de prescription général est de 2 ans à compter de la découverte (Limitations Act, SNB 2009, ch. L-8.5 art. 5). |
| Deliver Affidavit of Documents within 30 days after close of pleadings (r. 31.06). | Fournir l'affidavit de documents dans les 30 jours suivant la clôture des actes (r. 31.06). |
| Request a pre-trial conference at least 90 days before trial (r. 50.02). | Demander une conférence préparatoire au moins 90 jours avant le procès (r. 50.02). |

## Required Forms / Formulaires obligatoires
| English | Français |
| --- | --- |
| Form 16A – Statement of Claim (General). | Formulaire 16A – « Statement of Claim (General) ». |
| Form 30A – Affidavit of Documents. | Formulaire 30A – Affidavit de documents. |
| Form 38A – Notice of Examination. | Formulaire 38A – Avis d'interrogatoire. |
| Form 50A – Pre-Trial Conference Memorandum. | Formulaire 50A – Mémoire de conférence préparatoire. |

## Sample Pleadings / Modèles d'actes de procédure
| English | Français |
| --- | --- |
| "The Plaintiff claims damages arising from negligent misrepresentation contrary to the Civil Code of New Brunswick." | « La demanderesse réclame des dommages pour déclaration inexacte faite par négligence, contraire au Code civil du Nouveau-Brunswick. » |
| Application clause invoking Rule 23.02 for interim relief. | Clause de requête fondée sur la règle 23.02 pour mesures provisoires. |
| Pleading paragraph referencing contributory negligence apportionment (Fault Apportionment Act). | Paragraphe plaidant le partage de responsabilité (Fault Apportionment Act). |

## LexChrono Hooks / Intégrations LexChrono
| English | Français |
| --- | --- |
| `timeline.autoSchedule('nb_service_deadline', issuanceDate.plusMonths(6))` to supervise service. | `timeline.autoSchedule('nb_service_deadline', issuanceDate.plusMonths(6))` pour surveiller la signification. |
| Auto-create discovery packet via `tasks.spawn('NB_AFFIDAVIT_DOCS', pleadingsCloseDate.plusDays(30))`. | Créer automatiquement le dossier de communication via `tasks.spawn('NB_AFFIDAVIT_DOCS', pleadingsCloseDate.plusDays(30))`. |
| Pre-trial automation `workflows.launch('NB_PRETRIAL', trialDate.minusDays(120))`. | Automatisation de la conférence préparatoire `workflows.launch('NB_PRETRIAL', trialDate.minusDays(120))`. |
| Examination scheduling `scheduler.block('NB_FORM38A', examDate, assignedCounsel)` with bilingual notices. | Planification des interrogatoires `scheduler.block('NB_FORM38A', examDate, assignedCounsel)` avec avis bilingues. |

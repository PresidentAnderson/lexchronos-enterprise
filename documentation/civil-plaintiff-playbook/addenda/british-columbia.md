# British Columbia Civil Plaintiff Addendum / Addenda pour la Colombie-Britannique

## Critical Deadlines / Délais critiques
| English | Français |
| --- | --- |
| Serve the Notice of Civil Claim within 12 months after filing (Supreme Court Civil Rule 3-2(1)). | Signifier l'« Notice of Civil Claim » dans les 12 mois du dépôt (Règle 3-2(1) des Supreme Court Civil Rules). |
| General limitation period is 2 years from discovery (Limitation Act, s. 6). | Le délai de prescription général est de 2 ans à compter de la découverte (Limitation Act, art. 6). |
| Deliver a List of Documents within 35 days after the end of pleadings (Rule 7-1(1)). | Fournir la liste des documents dans les 35 jours suivant la clôture des actes de procédure (règle 7-1(1)). |
| Apply for trial date within 12 months of the Notice of Trial or risk case management intervention (Rule 12-1). | Demander une date de procès dans les 12 mois de l'avis de procès sous peine d'intervention de gestion (règle 12-1). |

## Required Forms / Formulaires obligatoires
| English | Français |
| --- | --- |
| Form 1 – Notice of Civil Claim with bilingual style of cause. | Formulaire 1 – Notice of Civil Claim avec intitulé bilingue. |
| Form 21 – List of Documents. | Formulaire 21 – Liste des documents. |
| Form 32 – Notice of Trial. | Formulaire 32 – Avis de procès. |
| Form 48 – Trial Brief (filed 28 days before trial). | Formulaire 48 – Mémoire de procès (déposé 28 jours avant le procès). |

## Sample Pleadings / Modèles d'actes de procédure
| English | Français |
| --- | --- |
| "The Plaintiff claims damages for negligence resulting in personal injury contrary to the Negligence Act, RSBC 1996." | « La demanderesse réclame des dommages-intérêts pour négligence ayant causé des blessures en vertu du Negligence Act, RSBC 1996. » |
| Case plan proposal clause referencing Rule 5-3. | Clause de plan d'instance mentionnant la règle 5-3. |
| Undertaking response referencing proportionality under Rule 1-3(2). | Réponse à un engagement rappelant le principe de proportionnalité de la règle 1-3(2). |

## LexChrono Hooks / Intégrations LexChrono
| English | Français |
| --- | --- |
| `timeline.autoSchedule('bc_service_limit', filingDate.plusMonths(12))` to track service window. | `timeline.autoSchedule('bc_service_limit', filingDate.plusMonths(12))` pour suivre le délai de signification. |
| Discovery checklist triggered via `tasks.spawn('BC_RULE7_LIST', pleadingsCloseDate.plusDays(35))`. | Liste de communication déclenchée via `tasks.spawn('BC_RULE7_LIST', pleadingsCloseDate.plusDays(35))`. |
| Trial brief automation: `documents.merge('BC_FORM_48', trialDate.minusDays(28))`. | Automatisation du mémoire : `documents.merge('BC_FORM_48', trialDate.minusDays(28))`. |
| Management alert `alerts.create('bc_case_plan', filingDate.plusMonths(6))` for case plan conference. | Alerte de gestion `alerts.create('bc_case_plan', filingDate.plusMonths(6))` pour la conférence sur le plan d'instance. |

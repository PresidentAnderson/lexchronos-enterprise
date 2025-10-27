# Nova Scotia Civil Plaintiff Addendum / Addenda pour la Nouvelle-Écosse

## Critical Deadlines / Délais critiques
| English | Français |
| --- | --- |
| Serve the Statement of Claim within 6 months after filing (Civil Procedure Rule 31.09). | Signifier la « Statement of Claim » dans les 6 mois suivant le dépôt (Civil Procedure Rule 31.09). |
| General limitation period is 2 years from discovery (Limitations of Actions Act, SNS 2014 c. 35 s. 8). | Délai de prescription général de 2 ans à compter de la découverte (Limitations of Actions Act, SNS 2014 c. 35 art. 8). |
| Provide Affidavit of Documents within 50 days after close of pleadings (Rule 15.04). | Fournir l'affidavit de documents dans les 50 jours suivant la clôture des actes (règle 15.04). |
| File Trial Readiness Report no later than 60 days before the assigned trial date (Rule 17.02). | Déposer le rapport de préparation au procès au plus tard 60 jours avant la date fixée (règle 17.02). |

## Required Forms / Formulaires obligatoires
| English | Français |
| --- | --- |
| Form 16A – Statement of Claim. | Formulaire 16A – « Statement of Claim ». |
| Form 30A – Affidavit of Documents. | Formulaire 30A – Affidavit de documents. |
| Form 18A – Notice of Application (if interlocutory relief sought). | Formulaire 18A – Avis de requête (pour mesures interlocutoires). |
| Form 47.09 – Trial Readiness Report. | Formulaire 47.09 – Rapport de préparation au procès. |

## Sample Pleadings / Modèles d'actes de procédure
| English | Français |
| --- | --- |
| "The Plaintiff claims damages pursuant to the Nova Scotia Human Rights Act, RSNS 1989 c. 214." | « La demanderesse réclame des dommages en vertu du Nova Scotia Human Rights Act, RSNS 1989 c. 214. » |
| Interlocutory motion clause referencing Rule 32.01 for preservation orders. | Clause de requête interlocutoire fondée sur la règle 32.01 pour les ordonnances de conservation. |
| Pleading referencing prejudgment interest under Judicature Act, RSNS 1989 c. 240 s. 45. | Plaidoirie mentionnant les intérêts avant jugement selon le Judicature Act, RSNS 1989 c. 240 art. 45. |

## LexChrono Hooks / Intégrations LexChrono
| English | Français |
| --- | --- |
| `timeline.autoSchedule('ns_service_limit', filingDate.plusMonths(6))` for service enforcement. | `timeline.autoSchedule('ns_service_limit', filingDate.plusMonths(6))` pour surveiller la signification. |
| Discovery automation `tasks.spawn('NS_DISCLOSURE', pleadingsCloseDate.plusDays(50))`. | Automatisation de la communication `tasks.spawn('NS_DISCLOSURE', pleadingsCloseDate.plusDays(50))`. |
| Trial readiness reminders via `alerts.create('ns_trial_report', trialDate.minusDays(75))`. | Rappels de préparation au procès avec `alerts.create('ns_trial_report', trialDate.minusDays(75))`. |
| Application workflow `workflows.launch('NS_INTERIM_APP', motionDate.minusDays(7))` for bilingual filings. | Flux de requête `workflows.launch('NS_INTERIM_APP', motionDate.minusDays(7))` pour les dépôts bilingues. |

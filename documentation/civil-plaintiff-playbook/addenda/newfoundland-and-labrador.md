# Newfoundland and Labrador Civil Plaintiff Addendum / Addenda pour Terre-Neuve-et-Labrador

## Critical Deadlines / Délais critiques
| English | Français |
| --- | --- |
| Serve the Statement of Claim within 6 months of issuance (Rules of the Supreme Court, 1986 r. 6A.07). | Signifier la « Statement of Claim » dans les 6 mois suivant la délivrance (Rules of the Supreme Court, 1986 r. 6A.07). |
| General limitation period is 2 years from discoverability (Limitations Act, SNL 1995 c. L-16.1 s. 5). | Délai de prescription général de 2 ans à compter de la découverte (Limitations Act, SNL 1995 c. L-16.1 art. 5). |
| Deliver Affidavit of Documents within 10 days after close of pleadings (r. 34.03). | Fournir l'affidavit de documents dans les 10 jours suivant la clôture des actes (r. 34.03). |
| File the Request for Trial Date once discovery is complete to avoid dismissal for delay (Practice Rule 56A). | Déposer la demande de date de procès après la communication pour éviter le rejet pour délai (règle de pratique 56A). |

## Required Forms / Formulaires obligatoires
| English | Français |
| --- | --- |
| Form 16 – Statement of Claim. | Formulaire 16 – « Statement of Claim ». |
| Form 30 – Affidavit of Documents. | Formulaire 30 – Affidavit de documents. |
| Form 42 – Request for Date for Trial. | Formulaire 42 – Demande de fixation de date de procès. |
| Form 56A – Pre-Trial Conference Memorandum. | Formulaire 56A – Mémoire de conférence préparatoire. |

## Sample Pleadings / Modèles d'actes de procédure
| English | Français |
| --- | --- |
| "The Plaintiff claims specific performance of the Agreement of Purchase and Sale dated 12 March 2023." | « La demanderesse réclame l'exécution spécifique de la convention d'achat-vente datée du 12 mars 2023. » |
| Motion paragraph referencing Rule 25.02 for interim injunction. | Paragraphe de requête fondé sur la règle 25.02 pour une injonction provisoire. |
| Pleading referencing interest under Judicature Act, RSNL 1990 c. J-4. | Plaidoirie mentionnant les intérêts selon le Judicature Act, RSNL 1990 c. J-4. |

## LexChrono Hooks / Intégrations LexChrono
| English | Français |
| --- | --- |
| `timeline.autoSchedule('nl_service_deadline', issuanceDate.plusMonths(6))` for service compliance. | `timeline.autoSchedule('nl_service_deadline', issuanceDate.plusMonths(6))` pour suivre la signification. |
| Discovery trigger `tasks.spawn('NL_DISCLOSURE_R34', pleadingsCloseDate.plusDays(10))`. | Déclencheur de communication `tasks.spawn('NL_DISCLOSURE_R34', pleadingsCloseDate.plusDays(10))`. |
| Trial readiness flow `workflows.launch('NL_TRIAL_DATE', discoveryCompleteDate.plusDays(14))`. | Flux de préparation au procès `workflows.launch('NL_TRIAL_DATE', discoveryCompleteDate.plusDays(14))`. |
| Pre-trial memo automation `documents.merge('NL_FORM56A', conferenceDate.minusDays(14))`. | Automatisation du mémoire `documents.merge('NL_FORM56A', conferenceDate.minusDays(14))`. |

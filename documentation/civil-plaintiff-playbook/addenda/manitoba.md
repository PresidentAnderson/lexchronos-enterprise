# Manitoba Civil Plaintiff Addendum / Addenda pour le Manitoba

## Critical Deadlines / Délais critiques
| English | Français |
| --- | --- |
| Serve the Statement of Claim within 6 months after it is issued (King's Bench Rules r. 3.02). | Signifier la « Statement of Claim » dans les 6 mois suivant sa délivrance (King's Bench Rules r. 3.02). |
| General limitation period is 2 years from discoverability (Limitation of Actions Act, s. 7). | La prescription générale est de 2 ans à compter de la découverte (Limitation of Actions Act, art. 7). |
| Deliver Affidavit of Documents within 10 days after close of pleadings unless parties agree otherwise (r. 30.06). | Fournir l'affidavit de documents dans les 10 jours suivant la clôture des actes, sauf entente contraire (r. 30.06). |
| Set down for trial by filing Form 47 within 30 days after discovery is complete. | Inscrire pour procès en déposant le formulaire 47 dans les 30 jours suivant la fin des interrogatoires préalables. |

## Required Forms / Formulaires obligatoires
| English | Français |
| --- | --- |
| Form 16A – Statement of Claim. | Formulaire 16A – « Statement of Claim ». |
| Form 30A – Affidavit of Documents. | Formulaire 30A – Affidavit de documents. |
| Form 21 – Notice of Trial. | Formulaire 21 – Avis de procès. |
| Form 47 – Request to Set Action Down for Trial. | Formulaire 47 – Demande d'inscription pour instruction. |

## Sample Pleadings / Modèles d'actes de procédure
| English | Français |
| --- | --- |
| "The Plaintiff claims damages for breach of fiduciary duty contrary to the Trustee Act, CCSM c. T160." | « La demanderesse réclame des dommages pour violation d'obligation fiduciaire en vertu du Trustee Act, CCSM c. T160. » |
| Motion clause referencing Rule 19.01 for summary judgment. | Clause de requête fondée sur la règle 19.01 pour jugement sommaire. |
| Costs prayer referencing Rule 57 scale. | Conclusions sur les dépens renvoyant à l'échelle de la règle 57. |

## LexChrono Hooks / Intégrations LexChrono
| English | Français |
| --- | --- |
| `timeline.autoSchedule('mb_service_limit', issuanceDate.plusMonths(6))` for service monitoring. | `timeline.autoSchedule('mb_service_limit', issuanceDate.plusMonths(6))` pour surveiller la signification. |
| Discovery automation via `tasks.spawn('MB_AFFIDAVIT_DOCS', pleadingsCloseDate.plusDays(10))`. | Automatisation de la communication avec `tasks.spawn('MB_AFFIDAVIT_DOCS', pleadingsCloseDate.plusDays(10))`. |
| Trial readiness workflow `workflows.launch('MB_TRIAL_SET', discoveryCompleteDate.plusDays(30))`. | Flux de préparation au procès `workflows.launch('MB_TRIAL_SET', discoveryCompleteDate.plusDays(30))`. |
| Docket mapping `dockets.mapTo('MB_FORM47', trialRequestId)` to file Form 47 packages. | Cartographie du greffe `dockets.mapTo('MB_FORM47', trialRequestId)` pour déposer les formulaires 47. |

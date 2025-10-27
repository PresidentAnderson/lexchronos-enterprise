# Ontario Civil Plaintiff Addendum / Addenda pour l'Ontario

## Critical Deadlines / Délais critiques
| English | Français |
| --- | --- |
| Serve the Statement of Claim within 6 months after issuance (Rules of Civil Procedure r. 14.08(1)). | Signifier la « Statement of Claim » dans les 6 mois suivant l'émission (Règles de procédure civile r. 14.08(1)). |
| General limitation period is 2 years from discovery (Limitations Act, 2002 s. 4). | Délai de prescription général de 2 ans à compter de la découverte (Loi de 2002 sur la prescription des actions, art. 4). |
| Serve Affidavit of Documents within 10 days after close of pleadings (r. 30.03(3)). | Signifier l'affidavit de documents dans les 10 jours suivant la clôture des actes (r. 30.03(3)). |
| Request trial date and attend pre-trial conference at least 90 days before trial (r. 50.02). | Demander la date de procès et tenir la conférence préparatoire au moins 90 jours avant le procès (r. 50.02). |

## Required Forms / Formulaires obligatoires
| English | Français |
| --- | --- |
| Form 14A – Statement of Claim (General). | Formulaire 14A – « Statement of Claim (General) ». |
| Form 30A – Affidavit of Documents. | Formulaire 30A – Affidavit de documents. |
| Form 37A – Notice of Motion. | Formulaire 37A – Avis de motion. |
| Form 50A – Pre-Trial Conference Memorandum. | Formulaire 50A – Mémoire de conférence préparatoire. |

## Sample Pleadings / Modèles d'actes de procédure
| English | Français |
| --- | --- |
| "The Plaintiff claims damages for breach of the Consumer Protection Act, 2002, SO 2002, c. 30." | « La demanderesse réclame des dommages pour violation de la Loi de 2002 sur la protection du consommateur, L.O. 2002, chap. 30. » |
| Motion clause invoking Rule 19 for summary judgment. | Clause de motion invoquant la règle 19 pour jugement sommaire. |
| Pleading paragraph seeking prejudgment interest under Courts of Justice Act s. 128. | Paragraphe réclamant les intérêts avant jugement selon la Loi sur les tribunaux judiciaires, art. 128. |

## LexChrono Hooks / Intégrations LexChrono
| English | Français |
| --- | --- |
| `timeline.autoSchedule('on_service_limit', issuanceDate.plusMonths(6))` for service compliance. | `timeline.autoSchedule('on_service_limit', issuanceDate.plusMonths(6))` pour surveiller la signification. |
| Discovery workflow `tasks.spawn('ON_AFFIDAVIT_DOCS', pleadingsCloseDate.plusDays(10))`. | Flux de communication `tasks.spawn('ON_AFFIDAVIT_DOCS', pleadingsCloseDate.plusDays(10))`. |
| Pre-trial automation `workflows.launch('ON_PRETRIAL', trialDate.minusDays(120))`. | Automatisation de la conférence préparatoire `workflows.launch('ON_PRETRIAL', trialDate.minusDays(120))`. |
| Motion toolkit linking `documents.merge('ON_FORM37A', motionDate.minusDays(5))`. | Trousse de motion liant `documents.merge('ON_FORM37A', motionDate.minusDays(5))`. |

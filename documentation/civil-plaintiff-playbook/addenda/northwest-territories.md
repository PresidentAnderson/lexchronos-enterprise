# Northwest Territories Civil Plaintiff Addendum / Addenda pour les Territoires du Nord-Ouest

## Critical Deadlines / Délais critiques
| English | Français |
| --- | --- |
| Serve the Statement of Claim within 6 months after issuance (Rules of the Supreme Court of the Northwest Territories r. 25). | Signifier la « Statement of Claim » dans les 6 mois suivant l'émission (Rules of the Supreme Court of the Northwest Territories r. 25). |
| General limitation period is 2 years from discovery (Limitation Act, SNWT 2008 c. 22 s. 5). | Délai de prescription général de 2 ans à compter de la découverte (Limitation Act, SNWT 2008 c. 22 art. 5). |
| Serve Affidavit of Documents within 30 days after close of pleadings (r. 223). | Signifier l'affidavit de documents dans les 30 jours suivant la clôture des actes (r. 223). |
| File Certificate of Readiness prior to requesting trial date (r. 390). | Déposer le certificat de préparation avant de demander une date de procès (r. 390). |

## Required Forms / Formulaires obligatoires
| English | Français |
| --- | --- |
| Form 14 – Statement of Claim. | Formulaire 14 – « Statement of Claim ». |
| Form 65 – Affidavit of Documents. | Formulaire 65 – Affidavit de documents. |
| Form 37 – Notice of Motion. | Formulaire 37 – Avis de motion. |
| Form 124 – Certificate of Readiness. | Formulaire 124 – Certificat de préparation. |

## Sample Pleadings / Modèles d'actes de procédure
| English | Français |
| --- | --- |
| "The Plaintiff claims damages for breach of the Petroleum Products Act, SNWT 2006 c. 13." | « La demanderesse réclame des dommages pour violation du Petroleum Products Act, SNWT 2006 c. 13. » |
| Motion clause referencing Rule 230 for examinations outside the territory. | Clause de requête fondée sur la règle 230 pour des interrogatoires à l'extérieur du territoire. |
| Pleading referencing interest under Judicature Ordinance, RSNWT 1988 c. J-1. | Plaidoirie mentionnant les intérêts selon le Judicature Ordinance, RSNWT 1988 c. J-1. |

## LexChrono Hooks / Intégrations LexChrono
| English | Français |
| --- | --- |
| `timeline.autoSchedule('nwt_service_limit', issuanceDate.plusMonths(6))` for service oversight. | `timeline.autoSchedule('nwt_service_limit', issuanceDate.plusMonths(6))` pour surveiller la signification. |
| Discovery automation `tasks.spawn('NWT_DISCLOSURE', pleadingsCloseDate.plusDays(30))`. | Automatisation de la communication `tasks.spawn('NWT_DISCLOSURE', pleadingsCloseDate.plusDays(30))`. |
| Trial readiness flow `workflows.launch('NWT_CERT_READY', discoveryCompleteDate.plusDays(21))`. | Flux de préparation `workflows.launch('NWT_CERT_READY', discoveryCompleteDate.plusDays(21))`. |
| Motion package builder `documents.merge('NWT_FORM37', motionDate.minusDays(7))`. | Générateur de dossier de motion `documents.merge('NWT_FORM37', motionDate.minusDays(7))`. |

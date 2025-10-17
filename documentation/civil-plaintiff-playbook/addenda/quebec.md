# Québec Civil Plaintiff Addendum / Addenda pour le Québec

## Critical Deadlines / Délais critiques
| English | Français |
| --- | --- |
| Serve the originating application within 12 months of filing (CCP art. 110). | Signifier la demande introductive d'instance dans les 12 mois du dépôt (C.p.c., art. 110). |
| File the case protocol within 45 days after service when parties fail to agree (CCP art. 148). | Déposer le protocole de l'instance dans les 45 jours de la signification en l'absence d'entente (C.p.c., art. 148). |
| Complete pre-trial examinations within the timeline set by the case protocol; default ceiling is 6 months pre-trial (CCP art. 229). | Compléter les interrogatoires préalables selon le protocole; délai par défaut de 6 mois avant l'instruction (C.p.c., art. 229). |
| Apply for inscription for trial and judgment within 3 years of filing to avoid dismissal for delay (CCP art. 173). | Présenter la demande d'inscription pour instruction et jugement dans les 3 ans du dépôt afin d'éviter le rejet pour délai (C.p.c., art. 173). |

## Required Forms / Formulaires obligatoires
| English | Français |
| --- | --- |
| Originating Application (Form 100-001A) with bilingual style of cause. | Demande introductive d'instance (formulaire 100-001A) avec intitulé bilingue. |
| Case Protocol – Civil Matters (Form 105-002) filed jointly or unilaterally. | Protocole de l'instance – Matières civiles (formulaire 105-002) déposé conjointement ou unilatéralement. |
| List of Exhibits and Transmissions (Form 111-005). | Liste des pièces et transmissions (formulaire 111-005). |
| Declaration of Service (Form 1050) for bailiff returns. | Déclaration de signification (formulaire 1050) pour les retours d'huissier. |

## Sample Pleadings / Modèles d'actes de procédure
| English | Français |
| --- | --- |
| "Plaintiff seeks judgment ordering Defendant to pay CAD 150,000 with interest and the additional indemnity under article 1619 C.c.Q." | « La demanderesse sollicite un jugement condamnant la défenderesse à payer 150 000 $ avec intérêts et l'indemnité additionnelle prévue à l'article 1619 C.c.Q. » |
| Motion language: "Plaintiff requests authorization to conduct a 2-hour pre-trial examination pursuant to CCP art. 221." | Libellé de requête : « La demanderesse sollicite l'autorisation de tenir un interrogatoire préalable de 2 heures conformément à l'art. 221 C.p.c. » |
| Protective order clause referencing confidentiality under CCP art. 15. | « Clause d'ordonnance de confidentialité fondée sur l'article 15 C.p.c. » |

## LexChrono Hooks / Intégrations LexChrono
| English | Français |
| --- | --- |
| `timeline.autoSchedule('qc_ccp_service', filingDate.plusMonths(12))` to flag the 12-month service limit. | `timeline.autoSchedule('qc_ccp_service', filingDate.plusMonths(12))` pour signaler la limite de 12 mois pour la signification. |
| Attach `forms.attach('QC_FORM_105-002', caseId)` to enforce protocol submission. | Joindre `forms.attach('QC_FORM_105-002', caseId)` pour assurer le dépôt du protocole. |
| Trigger alert `alerts.create('qc_trial_readiness', protocolDate.plusMonths(30))` for trial inscription risk. | Déclencher l'alerte `alerts.create('qc_trial_readiness', protocolDate.plusMonths(30))` pour surveiller le risque de péremption. |
| Link evidence upload automation via `dockets.mapTo('CPC-111-005', exhibitBatchId)` for exhibit lists. | Lier l'automatisation de dépôt des pièces avec `dockets.mapTo('CPC-111-005', exhibitBatchId)` pour les listes de pièces. |

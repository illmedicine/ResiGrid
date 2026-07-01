export interface LegalClause {
  id: string;
  title: string;
  text: string;
  recommended?: boolean;
}

export interface ClauseCategory {
  id: string;
  label: string;
  clauses: LegalClause[];
}

export const LEGAL_CLAUSE_CATEGORIES: ClauseCategory[] = [
  {
    id: "occupancy",
    label: "Occupancy & Use",
    clauses: [
      {
        id: "authorized-occupants",
        title: "Authorized Occupants",
        recommended: true,
        text: `Only the persons listed in this Lease Agreement are authorized to reside in the Premises. Any person not listed herein who occupies the Premises for more than fourteen (14) consecutive days or more than thirty (30) days in any calendar year without the prior written consent of Landlord shall constitute a material breach of this Agreement. Tenant shall immediately notify Landlord in writing of any person desiring to reside in the Premises, and any such additional occupancy is subject to Landlord's prior written approval, credit/background screening, and may require an amended Lease Agreement and additional security deposit.`,
      },
      {
        id: "subletting",
        title: "No Subletting or Assignment",
        recommended: true,
        text: `Tenant shall not assign this Lease, sublet the Premises or any portion thereof, or permit any other person or entity to occupy the Premises without the express prior written consent of Landlord, which may be withheld in Landlord's sole and absolute discretion. Any unauthorized assignment or subletting shall be null and void and shall constitute a material breach of this Agreement, entitling Landlord to terminate this Lease upon written notice. Tenant shall remain fully liable for all obligations under this Lease notwithstanding any assignment or subletting that Landlord may permit.`,
      },
      {
        id: "business-use",
        title: "Residential Use Only",
        text: `The Premises shall be used and occupied solely as a private residential dwelling. Tenant shall not operate any business, commercial enterprise, or commercial activity on the Premises, including but not limited to home day care, salon, repair shop, storage of commercial inventory, or short-term rental (including platforms such as Airbnb, VRBO, or similar services). Violation of this provision shall constitute a material breach of this Lease and may result in immediate termination.`,
      },
      {
        id: "occupancy-limit",
        title: "Maximum Occupancy",
        text: `The maximum number of persons permitted to occupy the Premises shall not exceed two (2) persons per bedroom plus two (2) additional persons, in compliance with applicable local housing codes and fair housing laws. Any violation of this occupancy limit shall constitute a material breach of this Agreement.`,
      },
    ],
  },
  {
    id: "rent",
    label: "Rent & Payment Terms",
    clauses: [
      {
        id: "payment-method",
        title: "Rent Payment Method",
        recommended: true,
        text: `All rent payments shall be made through the ResiGrid platform unless otherwise agreed in writing. Rent is due on the first (1st) day of each calendar month and shall be considered late after the grace period specified in this Agreement. Tenant acknowledges that payment made through ResiGrid is the preferred method and that payment records maintained on the ResiGrid platform shall serve as the official payment ledger for purposes of the RGE Trust Profile and any dispute resolution.`,
      },
      {
        id: "returned-payment",
        title: "Returned Payment Fee",
        recommended: true,
        text: `In the event any check, ACH transfer, or electronic payment tendered by Tenant is returned, rejected, or reversed by any financial institution for any reason whatsoever, Tenant shall pay Landlord a returned payment fee of Seventy-Five Dollars ($75.00) per occurrence, in addition to any bank or platform charges incurred by Landlord. Following any returned payment, Landlord may, at Landlord's election, require all future payments to be made exclusively by certified check, money order, or cashier's check. A returned payment shall not be credited to Tenant's account until a replacement payment is received and cleared.`,
      },
      {
        id: "partial-payment",
        title: "Partial Payment Disclaimer",
        recommended: true,
        text: `Acceptance by Landlord of any partial payment of rent shall not constitute a waiver of Landlord's right to the full amount due, nor shall it constitute a waiver of any existing default by Tenant. No notation, endorsement, or statement on any check, payment portal, or other correspondence shall constitute an accord and satisfaction or otherwise modify Tenant's obligations hereunder. Landlord may accept partial payments without prejudice to Landlord's right to pursue any and all remedies available at law or in equity for the full amount owed.`,
      },
      {
        id: "rent-increase",
        title: "Rent Increase Notice",
        text: `Landlord reserves the right to increase rent upon the expiration of any fixed lease term or, for month-to-month tenancies, upon not less than thirty (30) days' prior written notice (or such longer period as required by applicable law). Tenant's continued occupancy of the Premises following the effective date of any rent increase shall constitute acceptance of the new rental rate. Any rent increase shall be consistent with applicable local ordinances, including any rent stabilization or rent control regulations.`,
      },
    ],
  },
  {
    id: "security-deposit",
    label: "Security Deposit",
    clauses: [
      {
        id: "deposit-terms",
        title: "Security Deposit Conditions & Use",
        recommended: true,
        text: `The security deposit shall be held by Landlord as security for the faithful performance by Tenant of all terms, covenants, and conditions of this Agreement. Landlord may apply the security deposit, in whole or in part, against: (a) any unpaid rent or other charges due under this Agreement; (b) cleaning fees necessary to restore the Premises to move-in condition beyond ordinary wear and tear; (c) repair of damages to the Premises, fixtures, or Landlord's property beyond normal wear and tear; (d) costs to replace unreturned keys, access cards, garage openers, or other devices; (e) storage or disposal of Tenant's personal property left on the Premises; and (f) any other actual damages arising from Tenant's breach of this Agreement. Landlord shall return the security deposit, or the unapplied balance thereof, within the time period required by applicable state law, accompanied by a written itemized statement of any deductions. Tenant shall not apply the security deposit toward any month's rent without Landlord's prior written consent.`,
      },
      {
        id: "deposit-conditions",
        title: "Conditions for Full Deposit Return",
        text: `The security deposit, or any portion thereof, shall be returned in full only if: (a) Tenant has paid all rent and other charges in full through the termination date; (b) the Premises are returned in the same condition as received, reasonable wear and tear excepted; (c) all personal property and debris have been removed; (d) all keys, access devices, and parking passes have been returned; (e) there are no unpaid utility bills transferred to Landlord; and (f) Tenant has provided a valid forwarding address in writing. Failure to satisfy any of the foregoing conditions shall entitle Landlord to make deductions from the security deposit to the extent permitted by applicable law.`,
      },
    ],
  },
  {
    id: "maintenance",
    label: "Maintenance, Repairs & Access",
    clauses: [
      {
        id: "tenant-maintenance",
        title: "Tenant Maintenance Obligations",
        recommended: true,
        text: `Tenant shall maintain the Premises in a clean, sanitary, and good condition and shall not commit or permit any waste, nuisance, or damage thereon. Tenant shall be solely responsible for and shall promptly repair all damage to the Premises, fixtures, appliances, or Landlord's property caused by Tenant, members of Tenant's household, guests, or pets, regardless of whether such damage is accidental or intentional. Without limiting the foregoing, Tenant's maintenance obligations include: (a) replacing all burned-out light bulbs with bulbs of equal wattage; (b) replacing HVAC filters every sixty (60) days or as recommended by the manufacturer; (c) keeping all drains, sinks, and toilets free of obstructions; (d) keeping all exterior areas within Tenant's exclusive control clean and free of debris; (e) promptly reporting to Landlord any maintenance issues, water damage, pest infestations, or safety hazards; and (f) taking reasonable precautions to prevent freezing of pipes during cold weather, including maintaining a minimum interior temperature of 55°F.`,
      },
      {
        id: "landlord-access",
        title: "Landlord Right of Entry",
        recommended: true,
        text: `Landlord and Landlord's authorized representatives shall have the right to enter the Premises upon not less than twenty-four (24) hours' prior notice to Tenant (which may be given verbally, in writing, or via the ResiGrid platform) for the purpose of: (a) making or inspecting necessary or agreed-upon repairs, maintenance, or improvements; (b) supplying services under this Agreement; (c) showing the Premises to prospective tenants, purchasers, mortgagees, or their representatives; (d) verifying Tenant's compliance with the terms of this Agreement; or (e) any other lawful purpose. In the event of an emergency, including but not limited to fire, flood, active water leak, gas leak, or other imminent threat to persons or property, Landlord may enter the Premises immediately without prior notice. Entry shall be made at reasonable times except in cases of emergency.`,
      },
      {
        id: "alterations",
        title: "No Alterations Without Consent",
        recommended: true,
        text: `Tenant shall not make any alterations, additions, improvements, or modifications to the Premises or any fixtures therein without the prior written consent of Landlord. This prohibition includes, without limitation: painting, wallpapering, or other redecorating; installation of any fixtures, appliances, satellite dishes, antennas, or security systems; removal or addition of door or window locks; installation of hooks, shelving, or cabinetry; or any modification that penetrates walls, floors, or ceilings. All alterations made by Tenant, whether or not consented to by Landlord, shall become the property of Landlord upon termination of this Lease unless Landlord directs Tenant in writing to remove such alterations, in which case Tenant shall restore the Premises to their original condition at Tenant's sole expense. Landlord's consent to any alteration shall not constitute consent to any further alterations.`,
      },
      {
        id: "damage-reporting",
        title: "Duty to Report Damage & Defects",
        text: `Tenant shall promptly notify Landlord in writing through the ResiGrid maintenance portal of any defects, damage, or conditions in the Premises that require repair, including but not limited to water leaks, plumbing issues, electrical malfunctions, HVAC failures, pest or rodent infestations, mold growth, damaged windows or doors, or any condition that may pose a health or safety risk. Tenant's failure to promptly report such conditions and resulting additional damages shall be charged to Tenant. Tenant's maintenance requests submitted through ResiGrid shall be the official record of reported conditions and repair history.`,
      },
    ],
  },
  {
    id: "condition",
    label: "Property Condition",
    clauses: [
      {
        id: "as-is",
        title: "Acceptance of Premises Condition",
        recommended: true,
        text: `Tenant acknowledges that Tenant has had the opportunity to inspect the Premises prior to occupancy and that, except as otherwise noted in a separate written Move-In Condition Checklist signed by both parties, the Premises are in good, clean, safe, and sanitary condition and in good repair. Tenant accepts the Premises in their current AS-IS condition and agrees to return the Premises to Landlord upon termination of this Lease in substantially the same condition as received, reasonable wear and tear excepted. Tenant acknowledges that no oral promises or representations have been made by Landlord or Landlord's agents regarding the condition of the Premises except as expressly stated herein.`,
      },
      {
        id: "move-out",
        title: "Move-Out Condition Requirements",
        recommended: true,
        text: `Upon the termination or expiration of this Lease, Tenant shall surrender the Premises to Landlord in move-in ready condition, which includes: (a) professional-grade cleaning of all interior surfaces, appliances, cabinets, and fixtures; (b) all floors swept, vacuumed, mopped, or steam-cleaned as appropriate; (c) all walls free of holes, marks, stains, scuffs, crayon, or adhesive; (d) all appliances cleaned inside and out and in proper working order; (e) all bathrooms sanitized; (f) all windows and window coverings cleaned; (g) all trash, personal property, and debris removed from the Premises and surrounding areas; and (h) all keys, parking passes, access cards, garage openers, and mailbox keys returned. Landlord shall conduct a move-out inspection and shall provide Tenant with a written itemized statement of deductions from the security deposit within the time period required by applicable law.`,
      },
      {
        id: "lead-paint",
        title: "Lead Paint Disclosure (Pre-1978 Properties)",
        text: `LEAD WARNING STATEMENT: Housing built before 1978 may contain lead-based paint. Lead from paint, paint chips, and dust can pose health hazards if not managed properly. Lead exposure is especially harmful to young children and pregnant women. Before renting pre-1978 housing, landlords must disclose the presence of known lead-based paint and/or lead-based paint hazards in the dwelling. Tenants must also receive a federally approved pamphlet on lead poisoning prevention. [Landlord to complete and attach required EPA Lead Disclosure Form if applicable.]`,
      },
      {
        id: "mold-disclosure",
        title: "Mold & Moisture Disclosure",
        text: `Tenant is advised that mold and mildew can develop when moisture accumulates in a property. To prevent mold growth, Tenant shall: (a) promptly report any water intrusion, leaks, condensation, or visible mold to Landlord; (b) adequately ventilate the Premises, particularly in bathrooms and kitchen areas; (c) promptly clean and dry any wet surfaces; and (d) refrain from blocking ventilation sources. Tenant shall not conduct activities that produce excessive moisture without adequate ventilation. Tenant shall not hold Landlord liable for mold resulting from Tenant's failure to take reasonable precautions or report conditions in a timely manner.`,
      },
    ],
  },
  {
    id: "liability",
    label: "Liability & Insurance",
    clauses: [
      {
        id: "landlord-disclaimer",
        title: "Landlord Liability Limitation",
        recommended: true,
        text: `LANDLORD SHALL NOT BE LIABLE TO TENANT, MEMBERS OF TENANT'S HOUSEHOLD, GUESTS, OR INVITEES FOR ANY LOSS, INJURY, OR DAMAGE TO PERSONS OR PROPERTY CAUSED BY OR RESULTING FROM: (a) THEFT, BURGLARY, ASSAULT, VANDALISM, OR OTHER ACTS OF THIRD PARTIES; (b) FIRE, EXPLOSION, FLOODING, WATER DAMAGE, RAIN, HAIL, HURRICANE, TORNADO, OR OTHER ACTS OF NATURE OR FORCE MAJEURE; (c) TENANT'S OWN NEGLIGENCE OR THE NEGLIGENCE OF TENANT'S HOUSEHOLD MEMBERS, GUESTS, OR PETS; (d) FAILURE OF UTILITIES OR SERVICES BEYOND LANDLORD'S CONTROL; OR (e) ANY OTHER CAUSE EXCEPT TO THE EXTENT DIRECTLY CAUSED BY LANDLORD'S GROSS NEGLIGENCE OR WILLFUL MISCONDUCT. Tenant is strongly advised to obtain comprehensive renter's insurance to protect against all foreseeable risks.`,
      },
      {
        id: "renters-insurance",
        title: "Renter's Insurance Requirement",
        recommended: true,
        text: `Tenant shall, at Tenant's sole cost and expense, obtain and maintain throughout the term of this Lease a renter's insurance policy from an insurer licensed in the state where the Premises are located, providing: (a) personal property coverage in an amount sufficient to cover Tenant's personal belongings; and (b) personal liability coverage in an amount of not less than One Hundred Thousand Dollars ($100,000) per occurrence. Tenant shall name Landlord as an additional interested party and shall provide Landlord with a certificate of insurance upon request and prior to taking possession of the Premises. Failure to obtain or maintain required insurance shall constitute a material breach of this Agreement. Landlord's property insurance does not cover Tenant's personal belongings.`,
      },
      {
        id: "indemnification",
        title: "Tenant Indemnification",
        text: `Tenant shall indemnify, defend, and hold harmless Landlord and Landlord's agents, officers, directors, employees, and successors from and against any and all claims, demands, actions, damages, judgments, costs, liability, and expense (including reasonable attorneys' fees and court costs) arising from or in connection with: (a) any loss of life, personal injury, or property damage occurring in or about the Premises during the Lease term; (b) any act, omission, or negligence of Tenant, Tenant's household members, guests, or invitees; (c) Tenant's breach of any term or condition of this Agreement; or (d) Tenant's violation of any applicable law or regulation. This indemnification obligation shall survive the termination of this Lease.`,
      },
    ],
  },
  {
    id: "rules",
    label: "House Rules & Conduct",
    clauses: [
      {
        id: "noise",
        title: "Noise, Nuisance & Disturbance",
        recommended: true,
        text: `Tenant shall not create, cause, or permit any unreasonable noise, disturbance, or nuisance that interferes with the peace, comfort, or quiet enjoyment of other occupants, neighbors, or the surrounding community. This prohibition includes, without limitation: excessively loud music, televisions, stereos, or other audio devices; loud parties or gatherings; disruptive or aggressive conduct; and persistent barking of animals. Tenant shall comply with all quiet hours as posted by Landlord, as established in this Agreement (if any), and as required by applicable local ordinance. Tenant shall be responsible for the conduct of all household members, guests, and pets. Any violation of this provision may result in written notice, fines, or termination of this Lease.`,
      },
      {
        id: "illegal-activity",
        title: "Prohibition of Illegal Activity",
        recommended: true,
        text: `Tenant and all members of Tenant's household and guests shall not engage in, participate in, or permit any illegal, criminal, or unlawful activity on or about the Premises or common areas of the property, including but not limited to: the manufacture, cultivation, sale, distribution, storage, or use of illegal drugs, controlled substances, or drug paraphernalia (including activities legal under state law but illegal under federal law); any act of violence, assault, or criminal threatening; illegal weapons possession or discharge; prostitution or solicitation; criminal gang activity; gambling; or any other activity constituting a crime under local, state, or federal law. Any such violation shall constitute an incurable and material breach of this Lease, entitling Landlord to immediately terminate this Agreement and pursue all remedies available at law or in equity, including but not limited to civil damages and injunctive relief.`,
      },
      {
        id: "trash",
        title: "Trash, Debris & Sanitation",
        text: `Tenant shall comply with all applicable garbage, recycling, and waste disposal regulations. All trash shall be placed in designated, covered receptacles and removed to designated collection areas only on scheduled collection days. Tenant shall not store trash, debris, furniture, appliances, equipment, or personal property in common areas, stairwells, hallways, parking areas, or on patios, balconies, or front porches in a manner that is unsightly, creates a health hazard, constitutes a fire risk, or violates applicable code. Tenant shall bear the cost of any fines imposed on Landlord due to Tenant's violation of waste disposal regulations.`,
      },
      {
        id: "weapons",
        title: "Firearms & Weapons Policy",
        text: `All firearms and weapons kept on the Premises must be stored and maintained in strict compliance with all applicable federal, state, and local laws, including secure storage requirements. Tenant assumes full and exclusive responsibility for the safe storage, handling, and use of any firearms or weapons on the Premises. Tenant shall indemnify and hold harmless Landlord from any liability, damage, or injury arising from Tenant's possession of firearms or weapons on the Premises. Any discharge of a firearm or weapon on or about the Premises, except in a legally recognized act of self-defense, shall constitute grounds for immediate termination of this Lease.`,
      },
      {
        id: "common-areas",
        title: "Common Area Use",
        text: `Tenant and Tenant's guests shall use all common areas, amenities, and facilities of the property in a clean, orderly, and respectful manner and shall comply with all rules and regulations posted by Landlord governing such use. Tenant shall not store personal property in common areas, damage or tamper with common area fixtures or equipment, or permit children under age fourteen (14) to use any amenity without direct adult supervision. Landlord reserves the right to restrict or close access to common areas for maintenance, safety, or other legitimate reasons without liability to Tenant.`,
      },
    ],
  },
  {
    id: "utilities-services",
    label: "Utilities & Services",
    clauses: [
      {
        id: "utility-interruption",
        title: "Utility Service Interruption",
        recommended: true,
        text: `Landlord shall not be liable for any interruption or failure of utility services not caused by Landlord's gross negligence or willful misconduct, including interruptions caused by utility companies, weather events, governmental action, or circumstances beyond Landlord's reasonable control. No reduction in rent or right to terminate this Lease shall arise from any such interruption. Tenant shall promptly notify Landlord of any utility failure or interruption. Tenant shall not tamper with, disable, or bypass any utility meters, safety devices, smoke detectors, carbon monoxide detectors, or security systems on the Premises.`,
      },
      {
        id: "freeze-protection",
        title: "Freeze & Weather Protection",
        text: `During all periods when the outside temperature falls below 32°F (0°C), Tenant shall maintain the interior temperature of the Premises at a minimum of 55°F (13°C) at all times, including during vacations, absences, or periods when the Premises are temporarily unoccupied. Tenant shall leave all cabinet doors beneath sinks open during extreme cold to allow heat circulation around pipes. Tenant shall disconnect and drain any outdoor hoses prior to freezing weather. Tenant shall be fully responsible for any damage to the Premises resulting from Tenant's failure to comply with this provision, including the cost of burst pipe repair, water damage restoration, and any resulting loss.`,
      },
      {
        id: "satellite-antennas",
        title: "Satellite Dishes & Antennas",
        text: `Tenant shall not install any satellite dish, antenna, or reception device on or about the exterior of the Premises, on the roof, or in any location that requires penetration of exterior walls, the roof, or other structural components, without Landlord's prior written consent. Any such installation must comply with applicable FCC rules, local ordinances, and any homeowner association regulations, and Tenant shall repair all penetrations and restore the Premises upon removal.`,
      },
    ],
  },
  {
    id: "termination",
    label: "Termination, Holdover & Renewal",
    clauses: [
      {
        id: "notice-to-vacate",
        title: "Notice to Vacate Requirements",
        recommended: true,
        text: `Upon expiration of this Lease, or to terminate a month-to-month tenancy, Tenant must provide Landlord with not less than thirty (30) days' prior written notice of intent to vacate (or such greater period as required by applicable law). Notice shall be delivered via the ResiGrid platform or in writing to the address specified in this Agreement. Failure to provide timely notice shall entitle Landlord to charge Tenant for an additional month's rent or the number of days by which notice was deficient, whichever is greater, regardless of whether Tenant has vacated the Premises.`,
      },
      {
        id: "holdover",
        title: "Holdover Tenancy",
        recommended: true,
        text: `If Tenant remains in possession of the Premises after the expiration or termination of this Lease without Landlord's prior written consent, such holdover shall be deemed a month-to-month tenancy at a daily rental rate equal to one hundred fifty percent (150%) of the then-applicable monthly rent divided by thirty (30), and all other terms and conditions of this Lease shall remain in full force and effect. Landlord may terminate any holdover tenancy upon thirty (30) days' written notice. Tenant shall be liable for all damages, costs, and losses incurred by Landlord as a result of any holdover, including consequential damages arising from Landlord's inability to deliver possession to an incoming tenant.`,
      },
      {
        id: "early-termination",
        title: "Early Termination Penalty",
        text: `If Tenant wishes to terminate this Lease prior to the expiration of the Lease term, Tenant must: (a) provide Landlord with not less than sixty (60) days' prior written notice of the desired termination date; and (b) pay Landlord an early termination fee equal to two (2) months' rent as liquidated damages, in addition to any rent owed through the date the Premises are re-rented or the Lease term expires, whichever occurs first. Payment of the early termination fee does not relieve Tenant of the obligation to pay rent during the notice period or any additional damages resulting from Tenant's early departure. This provision does not apply in circumstances where applicable law grants Tenant the right to terminate early (e.g., active military deployment, domestic violence situations, or uninhabitable conditions caused by Landlord).`,
      },
      {
        id: "abandonment",
        title: "Abandonment of Premises",
        text: `If Tenant vacates or abandons the Premises before the expiration of this Lease without Landlord's written consent, or if Tenant's conduct clearly indicates an intent to permanently vacate, Landlord may deem the Premises abandoned. Upon abandonment, Landlord may re-enter and take possession of the Premises, remove Tenant's personal property in accordance with applicable law, re-let the Premises on such terms as Landlord deems appropriate, and hold Tenant liable for all rent, expenses, and damages through the end of the Lease term, reduced by any net amounts received from a subsequent tenant. Landlord's duty to mitigate damages shall be satisfied by making commercially reasonable efforts to re-rent the Premises at fair market value.`,
      },
      {
        id: "renewal",
        title: "Lease Renewal & Automatic Conversion",
        text: `This Lease shall not automatically renew for an additional fixed term. If neither party provides notice to terminate, and Tenant remains in possession with Landlord's acceptance of rent after the Lease term expires, the tenancy shall convert to a month-to-month arrangement at the then-current rental rate and subject to all other terms and conditions of this Agreement. Either party may terminate a month-to-month tenancy upon thirty (30) days' written notice. Landlord reserves the right to modify the rental rate or any other lease terms upon conversion to month-to-month status.`,
      },
    ],
  },
  {
    id: "legal",
    label: "Standard Legal Provisions",
    clauses: [
      {
        id: "governing-law",
        title: "Governing Law & Jurisdiction",
        recommended: true,
        text: `This Lease shall be governed by, construed, and enforced in accordance with the laws of the State in which the Premises are located, without giving effect to any conflict of law provisions or choice of law rules that would cause the application of the laws of any other jurisdiction. Any legal action, suit, or proceeding arising from or relating to this Lease, the Premises, or the landlord-tenant relationship shall be instituted exclusively in the state or federal courts of competent jurisdiction located in the county where the Premises are situated. Both parties irrevocably submit to the personal jurisdiction and venue of such courts and waive any objection on the grounds of improper venue or inconvenient forum.`,
      },
      {
        id: "severability",
        title: "Severability",
        recommended: true,
        text: `If any provision, clause, sentence, or paragraph of this Lease is found or held to be invalid, illegal, or unenforceable by a court of competent jurisdiction, such provision shall be modified to the minimum extent necessary to make it enforceable, or, if such modification is not possible, such provision shall be stricken and severed from this Agreement. The invalidity or unenforceability of any provision shall not affect the validity or enforceability of any other provision of this Agreement, which shall continue in full force and effect as if such invalid or unenforceable provision had never been included.`,
      },
      {
        id: "entire-agreement",
        title: "Entire Agreement & Integration",
        recommended: true,
        text: `This Lease Agreement, together with all addenda, exhibits, and schedules attached hereto or incorporated by reference, constitutes the entire and complete agreement between the parties with respect to the Premises and the subject matter hereof, and supersedes all prior and contemporaneous negotiations, discussions, representations, warranties, understandings, and agreements, whether oral or written. No representations, promises, warranties, or inducements were made or relied upon by either party except as expressly set forth in this Agreement. No amendment, modification, waiver, or supplement to this Agreement shall be valid or binding unless made in writing and duly signed by both Landlord and Tenant.`,
      },
      {
        id: "joint-several",
        title: "Joint & Several Liability",
        recommended: true,
        text: `If there is more than one person executing this Lease as Tenant, each such person shall be jointly and severally liable for the full and complete performance of all obligations of Tenant hereunder, including without limitation the payment of all rent and other charges. A breach of any term of this Lease by any one Tenant shall be deemed a breach by all Tenants. Landlord may enforce this Agreement against any one or more Tenants, in any order and to any extent, without releasing any remaining Tenant from liability or requiring Landlord to first proceed against any other Tenant. Any notice given to, or any payment accepted from, any one Tenant shall be deemed notice to, or payment from, all Tenants.`,
      },
      {
        id: "attorneys-fees",
        title: "Attorney's Fees",
        text: `In any legal action, arbitration, or proceeding (including appeals) brought by either party to enforce or interpret this Lease or arising out of the landlord-tenant relationship, the prevailing party shall be entitled to recover from the non-prevailing party all reasonable attorney's fees, paralegal fees, court costs, expert witness fees, and other litigation expenses actually incurred, in addition to any other relief to which the prevailing party may be entitled. The right to recover attorney's fees shall be deemed to survive the termination of this Lease.`,
      },
      {
        id: "waiver",
        title: "No Waiver of Rights",
        recommended: true,
        text: `The failure of either party to enforce, or any delay in enforcing, any right, remedy, or provision of this Lease shall not constitute a waiver thereof or any other provision hereof, nor shall it prejudice either party's right to take subsequent action with respect to any future or continuing breach. No course of dealing between the parties shall modify or limit the terms of this Lease. A waiver of any specific breach shall not be construed as a waiver of any subsequent or similar breach. No waiver shall be effective unless made in writing and signed by the waiving party.`,
      },
      {
        id: "jury-waiver",
        title: "Jury Trial Waiver",
        text: `TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, BOTH LANDLORD AND TENANT HEREBY KNOWINGLY, VOLUNTARILY, INTENTIONALLY, AND IRREVOCABLY WAIVE ANY AND ALL RIGHTS EITHER MAY HAVE TO A TRIAL BY JURY WITH RESPECT TO ANY ACTION, LEGAL PROCEEDING, CLAIM, CROSS-CLAIM, COUNTERCLAIM, OR THIRD-PARTY CLAIM ARISING OUT OF, IN CONNECTION WITH, OR RELATING TO THIS LEASE, THE PREMISES, THE LANDLORD-TENANT RELATIONSHIP, OR THE ENFORCEMENT OF ANY PROVISION HEREOF. EACH PARTY ACKNOWLEDGES THAT THIS WAIVER IS A MATERIAL INDUCEMENT TO THE OTHER PARTY'S ENTRY INTO THIS AGREEMENT AND THAT THIS WAIVER HAS BEEN GIVEN KNOWINGLY AND FREELY.`,
      },
      {
        id: "counterparts",
        title: "Electronic Signatures & Counterparts",
        recommended: true,
        text: `This Lease may be executed in one or more counterparts, each of which shall be deemed an original, and all of which together shall constitute one and the same instrument. Electronic signatures, digital signatures, and signatures transmitted via the ResiGrid platform or any other electronic means shall be deemed original signatures for all purposes and shall be fully binding on the signing party to the same extent as an original handwritten signature. The parties agree that the electronic execution of this Lease through the ResiGrid platform constitutes a legally binding signature and consent to the terms hereof.`,
      },
    ],
  },
  {
    id: "move-in-out",
    label: "Move-In / Move-Out & Keys",
    clauses: [
      {
        id: "keys",
        title: "Keys & Access Devices",
        recommended: true,
        text: `Upon commencement of this Lease, Landlord shall provide Tenant with the agreed number of keys, access cards, garage door openers, parking passes, and any other access devices required for lawful occupancy of the Premises. Tenant shall not duplicate keys, change locks, or install additional or replacement locks without Landlord's prior written consent. Tenant shall return all keys and access devices to Landlord upon termination of this Lease. The cost of replacing any unreturned or duplicated key, card, or device shall be deducted from Tenant's security deposit. Loss of keys or access devices shall be reported to Landlord promptly, and replacement costs shall be borne by Tenant.`,
      },
      {
        id: "move-in-checklist",
        title: "Move-In Inspection & Checklist",
        recommended: true,
        text: `Prior to or within three (3) business days of taking possession of the Premises, Tenant and Landlord (or Landlord's agent) shall jointly complete and sign a Move-In Condition Checklist documenting the existing condition of the Premises, including all rooms, appliances, fixtures, walls, floors, and ceilings. This checklist shall serve as the baseline reference for assessing damages upon move-out and shall be controlling in any dispute concerning the condition of the Premises at the commencement of the tenancy. Tenant's failure to participate in or sign the Move-In Checklist within the specified period shall be deemed Tenant's acceptance that the Premises were received in good condition.`,
      },
      {
        id: "forwarding-address",
        title: "Forwarding Address Obligation",
        text: `Upon vacating the Premises, Tenant shall provide Landlord with a written forwarding address within three (3) days of departure. All security deposit accounting and any refunds shall be mailed to the forwarding address provided. If Tenant fails to provide a forwarding address, Landlord's mailing of any security deposit accounting or refund to the Premises address shall constitute adequate notice. Tenant's failure to provide a forwarding address shall not extend the time period within which Landlord is required to return the security deposit under applicable law.`,
      },
    ],
  },
];

export function getClauseById(id: string): LegalClause | undefined {
  for (const cat of LEGAL_CLAUSE_CATEGORIES) {
    const found = cat.clauses.find((c) => c.id === id);
    if (found) return found;
  }
  return undefined;
}

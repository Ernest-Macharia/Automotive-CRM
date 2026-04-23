'use client';

import { useMemo, useState } from 'react';
import { X, FileText, Download, Check, AlertCircle } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'diamond-rims' | 'headlight';
  selectedServices?: string[];
}

interface TermsSection {
  title: string;
  items: string[];
}

interface ServiceTerms {
  id: string;
  title: string;
  category: 'Service' | 'Product' | 'Process';
  aliases: string[];
  sections: TermsSection[];
}

const HEADLIGHT_TERMS_SECTIONS: TermsSection[] = [
  {
    title: 'Service Scope & Quality Standards',
    items: [
      'All services are performed to workshop quality standards and specifications.',
      'Timelines are estimates and can change if hidden defects are found.',
      'Cosmetic matching (including shade/finish) is best-effort and not exact-guaranteed.'
    ]
  },
  {
    title: 'Customer Responsibilities & Liabilities',
    items: [
      'Customer must disclose prior repairs, modifications, and known electrical issues.',
      'Customer accepts inherent risks linked to diagnostic and restoration work.',
      'No liability for failures caused by pre-existing defects or third-party modifications.'
    ]
  },
  {
    title: 'Payment, Warranty & Collection',
    items: [
      'Full payment is required before release of vehicle/parts.',
      'Warranty covers workmanship only and excludes pre-existing conditions.',
      'Rework applies to technical failures, not personal preference or cosmetic dissatisfaction.'
    ]
  }
];

const DIAMOND_RIMS_TERMS: ServiceTerms[] = [
  {
    id: 'rim-inspection',
    title: 'Rim Inspection',
    category: 'Service',
    aliases: ['rim inspection', 'inspection', 'pre-cnc inspection'],
    sections: [
      {
        title: 'Scope',
        items: [
          'Visual inspection (cracks, bends, welds, corrosion).',
          'Run-out testing.',
          'Structural integrity assessment.',
          'Pre-CNC inspection (for diamond cutting jobs).'
        ]
      },
      {
        title: 'Client Update',
        items: [
          'Inspection is visual and mechanical; hidden micro-cracks may not be detectable.',
          'Previous repairs (welding/straightening) reduce structural strength.',
          'Severely damaged rims may require replacement instead of repair.',
          'Diamond Rims reserves the right to refuse unsafe repairs.'
        ]
      }
    ]
  },
  {
    id: 'wheel-balancing',
    title: 'Wheel Balancing',
    category: 'Service',
    aliases: ['wheel balancing', 'balancing', 'dynamic balancing'],
    sections: [
      {
        title: 'Scope',
        items: [
          'Dynamic balancing.',
          'Weight fitting and calibration.'
        ]
      },
      {
        title: 'Client Update',
        items: [
          'Bent, cracked, or previously welded rims may give unreliable balancing results.',
          'Balancing does not correct suspension, alignment, or shock absorber issues.',
          'Weights may dislodge due to heat, water, or aggressive driving.',
          'Wheels must be re-torqued after 25-50 km following removal.'
        ]
      }
    ]
  },
  {
    id: 'rim-straightening',
    title: 'Rim Straightening',
    category: 'Service',
    aliases: ['rim straightening', 'straightening', 'run-out correction'],
    sections: [
      {
        title: 'Scope',
        items: [
          'Hydraulic straightening.',
          'Run-out correction.'
        ]
      },
      {
        title: 'Client Update',
        items: [
          'Severely bent rims may not return to true factory shape.',
          'Previously straightened rims may fatigue and crack.',
          'Out-of-round distortion may remain slightly visible.',
          'Cracked rims must not be straightened.',
          'Welded rims carry a higher failure risk.',
          'No structural warranty on straightening services.',
          'Rim may crack during straightening process.'
        ]
      }
    ]
  },
  {
    id: 'tig-welding',
    title: 'TIG Welding',
    category: 'Service',
    aliases: ['tig welding', 'welding', 'crack repair', 'rim welding'],
    sections: [
      {
        title: 'Technical Profile',
        items: [
          'Precision arc welding (Tungsten Inert Gas).',
          'Controlled heat input.',
          'Cleaner weld bead.',
          'Suitable for aluminum alloy rims (majority OEM rims).'
        ]
      },
      {
        title: 'Use Case',
        items: [
          'Crack repair.',
          'Minor structural fracture.',
          'Reinforcement of damaged lip.'
        ]
      },
      {
        title: 'Client Update',
        items: [
          'TIG welding does not restore factory structural integrity.',
          'Repaired areas remain weaker than original casting/forging.',
          'Previously welded rims carry elevated failure risk.',
          'Multiple repairs significantly reduce rim lifespan.',
          'Heat exposure during welding may alter metal properties.',
          'Repaired areas may crack again under impact or load.',
          'No structural warranty on welded areas.',
          'Diamond Rims is not liable for future structural failure after repair.'
        ]
      }
    ]
  },
  {
    id: 'gas-welding',
    title: 'Gas Welding',
    category: 'Service',
    aliases: ['gas welding', 'oxy-acetylene', 'welding repair'],
    sections: [
      {
        title: 'Technical Profile',
        items: [
          'Oxy-acetylene welding.',
          'Higher heat spread.',
          'Less precise heat control.',
          'Greater metallurgical distortion risk.'
        ]
      },
      {
        title: 'Use Case',
        items: [
          'Thick-section repairs.',
          'Non-critical structural areas.',
          'Older rim materials (if TIG unsuitable).'
        ]
      },
      {
        title: 'Client Update',
        items: [
          'Gas welding introduces higher heat distortion risk.',
          'Metal temper may be significantly altered.',
          'Higher probability of future cracking compared to TIG.',
          'Gas welding does not restore OEM strength.',
          'Visible surface variations may remain after repair.',
          'Repaired rims should not be used in high-speed or heavy-load applications.',
          'No structural warranty.',
          'Diamond Rims is not liable for post-repair failure.'
        ]
      }
    ]
  },
  {
    id: 'powder-coating-rims',
    title: 'Powder Coating (Rims)',
    category: 'Service',
    aliases: ['powder coating', 'rim powder coating', 'rims coating'],
    sections: [
      {
        title: 'Scope',
        items: [
          'Stripping and blasting.',
          'Powder application.',
          'Oven curing.'
        ]
      },
      {
        title: 'Client Update',
        items: [
          'Colour match may vary due to lighting, shade, and material differences.',
          'OEM finish replication is not guaranteed.',
          'Hidden flaws (casting pits, scratches, corrosion) may appear after stripping.',
          'No warranty for high-heat areas (near brakes/engine exposure).',
          'Redo policy applies only to technical coating failure - not colour dissatisfaction.',
          'Aesthetic dissatisfaction is not grounds for claim.'
        ]
      }
    ]
  },
  {
    id: 'diamond-cutting',
    title: 'Diamond Cutting (CNC Machining)',
    category: 'Service',
    aliases: ['diamond cutting', 'cnc', 'cnc machining', 'resurfacing'],
    sections: [
      {
        title: 'Scope',
        items: [
          'CNC resurfacing.',
          'Clear coat finishing.'
        ]
      },
      {
        title: 'Client Update',
        items: [
          'Rim must be perfectly straight before CNC machining.',
          'Straightening, if required, is charged separately.',
          'If imbalance or defect is detected during CNC, surface damage may occur.',
          'Power outages or voltage fluctuations during CNC may damage rim.',
          'CNC finish may differ from factory pattern or texture.',
          'No warranty on CNC diamond cutting finish.',
          'If damage occurs after CNC starts due to structural defect, Diamond Rims is not liable.'
        ]
      }
    ]
  },
  {
    id: 'caliper-spray-painting',
    title: 'Caliper Spray Painting',
    category: 'Service',
    aliases: ['caliper spray painting', 'caliper paint', 'spray painting'],
    sections: [
      {
        title: 'Scope',
        items: [
          'Cleaning and preparation.',
          'High-temp spray paint application.'
        ]
      },
      {
        title: 'Client Update',
        items: [
          'Spray finish may not match OEM powder-coated calipers.',
          'Heat exposure may affect longevity of spray finish.',
          'Brake dust and chemicals may cause premature wear.',
          'Minor surface imperfections may remain visible.',
          'Warranty applies only to peeling due to workmanship.'
        ]
      }
    ]
  },
  {
    id: 'caliper-powder-coating',
    title: 'Caliper Powder Coating',
    category: 'Service',
    aliases: ['caliper powder coating', 'powder coating caliper'],
    sections: [
      {
        title: 'Scope',
        items: [
          'Removal and stripping.',
          'Powder coating and curing.'
        ]
      },
      {
        title: 'Client Update',
        items: [
          'Colour match not guaranteed to OEM.',
          'High braking temperatures may affect long-term coating durability.',
          'Hidden surface flaws may appear after stripping.',
          'Reinstallation torque responsibility remains with installer.',
          'Warranty applies only to technical coating failure.'
        ]
      }
    ]
  },
  {
    id: 'brake-disc-skimming',
    title: 'Brake Disc Skimming',
    category: 'Service',
    aliases: ['brake disc skimming', 'disc skimming', 'disc resurfacing'],
    sections: [
      {
        title: 'Scope',
        items: [
          'Precision disc resurfacing.',
          'Thickness measurement.'
        ]
      },
      {
        title: 'Client Update',
        items: [
          'Skimming only possible if disc thickness remains above manufacturer minimum spec.',
          'Cracked, heat-damaged, or severely warped discs should be replaced.',
          'New brake pads recommended after skimming.',
          'Noise or squealing may continue if old or poor-quality pads are used.',
          'No guarantee if disc was previously skimmed or has unknown machining history.',
          'Skimming may reduce disc lifespan.'
        ]
      }
    ]
  },
  {
    id: 'caliper-covers',
    title: 'Caliper Covers',
    category: 'Product',
    aliases: ['caliper covers', 'caliper cover'],
    sections: [
      {
        title: 'Product Type',
        items: [
          'Decorative brake caliper covers.',
          'Bolt-on or clip-on installation.',
          'Non-OEM accessory.'
        ]
      },
      {
        title: 'Client Update',
        items: [
          'Caliper covers are cosmetic accessories only.',
          'They do not improve braking performance.',
          'Improper installation may cause noise or contact with wheel components.',
          'Heat from braking may affect long-term durability.',
          'Diamond Rims is not liable for brake system damage caused by improper third-party installation.',
          'Periodic inspection is recommended.',
          'Warranty covers manufacturing defects only - not wear, heat damage, or road debris impact.'
        ]
      },
      {
        title: 'Operational Note',
        items: [
          'Clearance check between rim and caliper cover must be mandatory.',
          'Installation checklist should include torque verification.',
          'Add a post-install test drive confirmation.',
          'Failure to check clearance creates serious liability exposure.'
        ]
      }
    ]
  },
  {
    id: 'seat-belts',
    title: 'Seat Belts',
    category: 'Product',
    aliases: ['seat belts', 'seat belt', 'rewebbing', 'seatbelt'],
    sections: [
      {
        title: 'Category Clarification',
        items: [
          'Confirm whether it is full seat belt replacement, rewebbing, cosmetic recolouring, or decorative covers.',
          'Seat belts are safety-critical components and carry high liability.'
        ]
      },
      {
        title: 'Client Update',
        items: [
          'Decorative covers do not alter original seat belt mechanism.',
          'Covers must not interfere with locking or retraction.',
          'Diamond Rims is not liable for improper installation by third parties.',
          'No safety performance guarantee applies.'
        ]
      }
    ]
  },
  {
    id: 'chemical-stripping',
    title: 'Chemical Stripping',
    category: 'Process',
    aliases: ['chemical stripping', 'stripping', 'paint removal'],
    sections: [
      {
        title: 'Scope',
        items: [
          'Removal of paint/powder coat using chemical agents.',
          'Surface cleaning prior to coating.'
        ]
      },
      {
        title: 'Client Update',
        items: [
          'Chemical stripping may reveal hidden defects (cracks, corrosion, casting pits).',
          'Previously repaired areas may become visible.',
          'Metal surface condition may differ from pre-stripped appearance.',
          'Severely corroded components may not be suitable for refinishing.',
          'Diamond Rims is not liable for pre-existing structural defects revealed during stripping.'
        ]
      }
    ]
  },
  {
    id: 'grinding',
    title: 'Grinding',
    category: 'Process',
    aliases: ['grinding', 'surface leveling', 'edge correction'],
    sections: [
      {
        title: 'Scope',
        items: [
          'Removal of weld excess.',
          'Surface leveling.',
          'Edge correction.'
        ]
      },
      {
        title: 'Client Update',
        items: [
          'Grinding removes material and may slightly alter dimensions.',
          'Excessive prior damage may limit cosmetic perfection.',
          'Grinding cannot restore original factory structure.',
          'Over-thinned areas may weaken component integrity.',
          'No structural warranty implied from grinding process.'
        ]
      }
    ]
  },
  {
    id: 'filling',
    title: 'Filling (Metal/Body Filler)',
    category: 'Process',
    aliases: ['filling', 'body filler', 'metal filler'],
    sections: [
      {
        title: 'Scope',
        items: [
          'Surface filling of minor imperfections.',
          'Cosmetic surface preparation before coating.'
        ]
      },
      {
        title: 'Client Update',
        items: [
          'Filling is cosmetic only, not structural reinforcement.',
          'Filler may crack or shrink over time under heat or impact.',
          'Heat from braking may affect filler longevity.',
          'Hidden defects may reappear after coating.',
          'No guarantee of permanent cosmetic perfection.'
        ]
      }
    ]
  },
  {
    id: 'bike-rims-powder-coating',
    title: 'Bike Rims Powder Coating',
    category: 'Service',
    aliases: ['bike rims powder coating', 'bike rims coating', 'motorbike rim coating'],
    sections: [
      {
        title: 'Scope',
        items: [
          'Stripping.',
          'Surface preparation.',
          'Powder coating and curing.'
        ]
      },
      {
        title: 'Client Update',
        items: [
          'Colour match not guaranteed to OEM.',
          'Spoke tension or structural issues are not corrected by coating.',
          'Hidden cracks or fatigue may appear after stripping.',
          'Heat curing process may expose pre-existing weaknesses.',
          'Warranty covers technical coating failure only.'
        ]
      }
    ]
  },
  {
    id: 'bike-parts-powder-coating',
    title: 'Bike Parts Powder Coating',
    category: 'Service',
    aliases: ['bike parts powder coating', 'bike powder coating', 'motorbike parts coating'],
    sections: [
      {
        title: 'Scope',
        items: [
          'Frame components.',
          'Swing arms.',
          'Brackets.',
          'Footrests.',
          'Engine covers (where applicable).'
        ]
      },
      {
        title: 'Client Update',
        items: [
          'Moving or friction surfaces should not be coated.',
          'High-heat areas may experience reduced coating lifespan.',
          'Threaded or tolerance-critical areas must be masked; dimensional variation may occur.',
          'Diamond Rims is not liable for mechanical fitment issues if parts were previously modified.',
          'Warranty covers coating adhesion failure only.'
        ]
      }
    ]
  },
  {
    id: 'other-parts-powder-coating',
    title: 'Other Parts Powder Coating',
    category: 'Service',
    aliases: ['other parts powder coating', 'automotive powder coating', 'industrial powder coating'],
    sections: [
      {
        title: 'Scope',
        items: [
          'Suspension components.',
          'Metal accessories.',
          'Decorative parts.'
        ]
      },
      {
        title: 'Client Update',
        items: [
          'Not all parts are suitable for oven curing temperatures.',
          'Rubber, bushings, and bearings must be removed before coating.',
          'Heat-sensitive materials may deform.',
          'Coating thickness may affect fitment tolerances.',
          'No responsibility for part failure due to pre-existing fatigue or corrosion.'
        ]
      }
    ]
  }
];

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const matchesServiceAlias = (serviceName: string, alias: string) => {
  const normalizedService = normalize(serviceName);
  const normalizedAlias = normalize(alias);

  if (!normalizedService || !normalizedAlias) {
    return false;
  }

  return normalizedService.includes(normalizedAlias) || normalizedAlias.includes(normalizedService);
};

export default function TermsModal({
  isOpen,
  onClose,
  mode = 'diamond-rims',
  selectedServices = []
}: TermsModalProps) {
  const normalizedSelectedServices = useMemo(
    () => selectedServices.map((service) => service.trim()).filter(Boolean),
    [selectedServices]
  );

  const visibleDiamondTerms = useMemo(() => {
    if (mode !== 'diamond-rims' || normalizedSelectedServices.length === 0) {
      return DIAMOND_RIMS_TERMS;
    }

    const matchedTerms = DIAMOND_RIMS_TERMS.filter((serviceTerms) =>
      normalizedSelectedServices.some((selectedService) =>
        [serviceTerms.title, ...serviceTerms.aliases].some((alias) => matchesServiceAlias(selectedService, alias))
      )
    );

    return matchedTerms.length > 0 ? matchedTerms : DIAMOND_RIMS_TERMS;
  }, [mode, normalizedSelectedServices]);

  const [activeServiceId, setActiveServiceId] = useState<string | null>(null);

  if (!isOpen) return null;

  const resolvedActiveServiceId =
    activeServiceId && visibleDiamondTerms.some((serviceTerms) => serviceTerms.id === activeServiceId)
      ? activeServiceId
      : (visibleDiamondTerms[0]?.id ?? null);

  const activeServiceTerms =
    visibleDiamondTerms.find((serviceTerms) => serviceTerms.id === resolvedActiveServiceId) ?? visibleDiamondTerms[0];

  const modalTitle =
    mode === 'diamond-rims' ? 'DIAMOND RIMS - TERMS & CONDITIONS' : 'SERVICE TERMS & CONDITIONS';

  const modalSubtitle =
    mode === 'diamond-rims'
      ? 'Service-specific agreement, risk disclosure, and warranty limitations'
      : 'Service Agreement & Warranty Terms';

  const showingSelectedServiceTerms =
    mode === 'diamond-rims' &&
    normalizedSelectedServices.length > 0 &&
    visibleDiamondTerms.length !== DIAMOND_RIMS_TERMS.length;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[92vh] overflow-hidden shadow-2xl">
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{modalTitle}</h2>
              <p className="text-purple-200 text-sm">{modalSubtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Close terms modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[74vh] space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-amber-900 mb-1">Important Notice</h4>
                <p className="text-sm text-amber-800">
                  These terms form a legally binding agreement. Read each service section before acceptance.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg">
                  <Download className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-900">Download Full Terms PDF</p>
                  <p className="text-xs text-blue-700">Keep a copy for compliance and customer disclosure records.</p>
                </div>
              </div>
              <a
                href="/api/documents/terms"
                download="Diamond-Rimz-Terms-Conditions.pdf"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </a>
            </div>
          </div>

          {mode === 'diamond-rims' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-bold text-gray-900">Service-Specific Terms</h3>
                <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700 font-medium">
                  {visibleDiamondTerms.length} service term set(s)
                </span>
              </div>

              {showingSelectedServiceTerms && (
                <p className="text-sm text-purple-700 bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
                  Showing terms linked to selected checklist services. Click another service below to view its terms.
                </p>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-4 border border-gray-200 rounded-xl p-3 max-h-[55vh] overflow-y-auto">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                    Services / Products / Processes
                  </p>
                  <div className="space-y-2">
                    {visibleDiamondTerms.map((serviceTerms) => {
                      const isActive = serviceTerms.id === activeServiceTerms?.id;
                      return (
                        <button
                          key={serviceTerms.id}
                          type="button"
                          onClick={() => setActiveServiceId(serviceTerms.id)}
                          className={`w-full text-left rounded-lg border px-3 py-2 transition-colors ${
                            isActive
                              ? 'border-purple-400 bg-purple-50'
                              : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/40'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-sm text-gray-900">{serviceTerms.title}</span>
                            <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                              {serviceTerms.category}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="lg:col-span-8 border border-gray-200 rounded-xl p-4">
                  {activeServiceTerms ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-3">
                        <h4 className="text-xl font-bold text-gray-900">{activeServiceTerms.title}</h4>
                        <span className="text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 font-medium uppercase tracking-wide">
                          {activeServiceTerms.category}
                        </span>
                      </div>

                      {activeServiceTerms.sections.map((section, index) => (
                        <div key={`${activeServiceTerms.id}-${section.title}`} className="border border-gray-200 rounded-lg p-4">
                          <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="flex items-center justify-center w-6 h-6 bg-purple-100 text-purple-700 rounded-full text-xs">
                              {index + 1}
                            </span>
                            {section.title}
                          </h5>
                          <ul className="space-y-2">
                            {section.items.map((item, itemIndex) => (
                              <li key={`${section.title}-${itemIndex}`} className="flex items-start gap-2">
                                <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-gray-700">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">No service terms available.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-900">Summary of Key Terms & Conditions</h3>
              {HEADLIGHT_TERMS_SECTIONS.map((section, index) => (
                <div key={section.title} className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 bg-purple-100 text-purple-600 rounded-full text-sm">
                      {index + 1}
                    </span>
                    {section.title}
                  </h4>
                  <ul className="space-y-2">
                    {section.items.map((item, itemIndex) => (
                      <li key={`${section.title}-${itemIndex}`} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-600">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-2">Acceptance Acknowledgment</h4>
            <p className="text-sm text-green-800 mb-3">
              By checking "I accept the Terms and Conditions", you acknowledge that:
            </p>
            <ul className="text-sm text-green-800 space-y-2">
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>You have read and understood the applicable terms for selected services.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>You agree to the disclosed service-specific risks and limitations.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>You had an opportunity to ask questions and receive clarification.</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Last updated:</span> April 23, 2026 |{' '}
              <span className="font-medium">Version:</span> 3.0
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium text-sm"
              >
                Close & Return
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

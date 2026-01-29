'use client';

import { useState } from 'react';
import { X, FileText, ExternalLink, Download, Check, AlertCircle } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TermsModal({ isOpen, onClose }: TermsModalProps) {
  if (!isOpen) return null;

  const termsSections = [
    {
      title: "Service Scope & Quality Standards",
      items: [
        "All services performed to Diamond Rimz quality standards and specifications",
        "Workmanship warranty: 6-12 months depending on service type",
        "No warranty for pre-existing conditions or hidden defects",
        "Color matching: Every effort made, but exact match not guaranteed",
        "Service timelines are estimates, not guarantees"
      ]
    },
    {
      title: "Customer Responsibilities & Liabilities",
      items: [
        "Customer accepts inherent risks of rim repair/modification",
        "No liability for structural failures from pre-existing damage",
        "Personal items left with vehicle/rims at customer's own risk",
        "Must disclose any previous repairs, modifications, or known issues",
        "Responsible for clearing dashboard error codes post-modification"
      ]
    },
    {
      title: "Payment & Collection Terms",
      items: [
        "Full payment required before collection of rims/vehicle",
        "Storage fee: KES 500 per day per part after 5 days of non-collection",
        "No liability for items not collected within 12 hours of completion notification",
        "Additional charges for extra work/parts will be communicated and approved",
        "Rims not collected within 30 days may be considered abandoned"
      ]
    },
    {
      title: "Warranty Details & Limitations",
      items: [
        "Warranty covers workmanship only, not materials or pre-existing issues",
        "Warranty void if modifications made by non-Diamond Rimz technicians",
        "No warranty for high-heat areas (brake components, engine bay)",
        "Cosmetic dissatisfaction not covered under warranty",
        "Redo policy applies only to technical failures, not color preferences"
      ]
    },
    {
      title: "Risk Acceptance & Limitations",
      items: [
        "Customization may cause irreversible changes to original design",
        "Rim straightening may reveal hidden cracks or weaknesses",
        "Powder coating may not match original color exactly",
        "Diamond cutting removes material and may affect structural integrity",
        "Welding repairs carry risk of heat damage to surrounding areas"
      ]
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">DIAMOND RIMZ - TERMS & CONDITIONS</h2>
              <p className="text-purple-200 text-sm">Service Agreement & Warranty Terms</p>
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

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          <div className="space-y-6">
            
            {/* Important Notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-amber-900 mb-1">IMPORTANT NOTICE</h4>
                  <p className="text-sm text-amber-800">
                    These terms constitute a legally binding agreement. Please read them carefully before accepting. 
                    If you have any questions, ask our staff for clarification.
                  </p>
                </div>
              </div>
            </div>

            {/* Download Link */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg">
                    <Download className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-900">Download Full Terms PDF</p>
                    <p className="text-xs text-blue-700">Complete 8-page terms and conditions document</p>
                  </div>
                </div>
                <a
                  href="/api/documents/terms"
                  download="Diamond-Rimz-Terms-Conditions.pdf"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </a>
              </div>
            </div>

            {/* Terms Sections */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Summary of Key Terms & Conditions</h3>
              
              {termsSections.map((section, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 bg-purple-100 text-purple-600 rounded-full text-sm">
                      {index + 1}
                    </span>
                    {section.title}
                  </h4>
                  <ul className="space-y-2">
                    {section.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-600">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Additional Clauses */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Additional Important Clauses</h4>
              <div className="text-sm text-gray-600 space-y-3">
                <p>
                  <strong>7.1 Force Majeure:</strong> Diamond Rimz shall not be liable for any delay or failure in performance resulting from causes beyond its reasonable control.
                </p>
                <p>
                  <strong>8.3 Dispute Resolution:</strong> Any disputes shall first attempt resolution through mediation in Nairobi, Kenya. Unresolved disputes shall be settled in Kenyan courts.
                </p>
                <p>
                  <strong>9.2 Amendments:</strong> These terms may be updated periodically. The version in effect at time of service shall apply.
                </p>
                <p>
                  <strong>10.1 Severability:</strong> If any provision is found invalid or unenforceable, the remaining provisions shall remain in full effect.
                </p>
              </div>
            </div>

            {/* Acceptance Acknowledgment */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">Acceptance Acknowledgment</h4>
              <p className="text-sm text-green-800 mb-3">
                By checking "I accept the Terms and Conditions", you acknowledge that:
              </p>
              <ul className="text-sm text-green-800 space-y-2 mb-3">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>You have read and understood all terms and conditions</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>You agree to be bound by all terms in the full document</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>You have had opportunity to ask questions and seek clarification</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>You accept all risks associated with rim services as outlined</span>
                </li>
              </ul>
              <p className="text-xs text-green-700 italic">
                This acknowledgment is legally binding and forms part of our service agreement.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Last updated:</span> January 2024 | <span className="font-medium">Version:</span> 2.1
            </div>
            <div className="flex items-center gap-3">
              <a
                href="/api/documents/terms"
                download="Diamond-Rimz-Terms-Conditions.pdf"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium flex items-center gap-2 text-sm"
              >
                <Download className="h-4 w-4" />
                Save Copy
              </a>
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
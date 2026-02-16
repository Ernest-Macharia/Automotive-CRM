// components/post-checklist/PostChecklistTypeModal.tsx
'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { Wrench, Sparkles, X, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PostChecklistTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrderId: string;
  opportunityId: string | { _id: string; subject?: string; customer?: any; assignedTo?: any };
}

export default function PostChecklistTypeModal({ 
  isOpen, 
  onClose, 
  workOrderId, 
  opportunityId 
}: PostChecklistTypeModalProps) {
  const router = useRouter();

  const getOpportunityIdString = (): string => {
    if (!opportunityId) return '';
    if (typeof opportunityId === 'string') return opportunityId;
    if (typeof opportunityId === 'object' && opportunityId?._id) return opportunityId._id;
    return '';
  };

  const handleSelectDiamondRims = () => {
    const oppId = getOpportunityIdString();
    router.push(`/post-checklist/create?workOrderId=${workOrderId}&opportunityId=${oppId}&source=workflow&clientType=diamond-rims`);
    onClose();
  };

  const handleSelectEagleLights = () => {
    const oppId = getOpportunityIdString();
    router.push(`/post-checklist/create?workOrderId=${workOrderId}&opportunityId=${oppId}&source=workflow&clientType=eagle-lights`);
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-center mb-6">
                  <Dialog.Title
                    as="h3"
                    className="text-2xl font-bold text-gray-900"
                  >
                    Select Post-Checklist Type
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <p className="text-gray-600 mb-8">
                  Choose the appropriate post-checklist template for quality verification. 
                  This will determine the final inspection criteria and sign-off requirements.
                </p>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Diamond Rims Post-Checklist Option */}
                  <button
                    onClick={handleSelectDiamondRims}
                    className="group relative bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-2 border-blue-200 hover:border-blue-400 rounded-xl p-6 text-left transition-all duration-200"
                  >
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">Quality Check</span>
                    </div>
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Wrench className="h-8 w-8 text-white" />
                    </div>
                    <h4 className="text-xl font-bold text-gray-900 mb-2">Diamond Rims</h4>
                    <p className="text-gray-600 text-sm mb-4">
                      Final rim inspection, balancing verification, cosmetic quality check, and customer sign-off
                    </p>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-blue-500" />
                        <span>Wheel alignment verification</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-blue-500" />
                        <span>Surface finish quality check</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-blue-500" />
                        <span>Torque specification validation</span>
                      </div>
                    </div>
                    <div className="flex items-center text-blue-600 font-semibold group-hover:gap-2 transition-all">
                      <span>Select Diamond Rims</span>
                      <Sparkles className="h-4 w-4" />
                    </div>
                  </button>

                  {/* Eagle Lights Post-Checklist Option */}
                  <button
                    onClick={handleSelectEagleLights}
                    className="group bg-gradient-to-br from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border-2 border-purple-200 hover:border-purple-400 rounded-xl p-6 text-left transition-all duration-200"
                  >
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full">Light Testing</span>
                    </div>
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Sparkles className="h-8 w-8 text-white" />
                    </div>
                    <h4 className="text-xl font-bold text-gray-900 mb-2">Eagle Lights</h4>
                    <p className="text-gray-600 text-sm mb-4">
                      Final headlight clarity verification, brightness testing, beam alignment, and quality certification
                    </p>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-purple-500" />
                        <span>Lens clarity certification</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-purple-500" />
                        <span>Beam pattern verification</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-purple-500" />
                        <span>UV protection validation</span>
                      </div>
                    </div>
                    <div className="flex items-center text-purple-600 font-semibold group-hover:gap-2 transition-all">
                      <span>Select Eagle Lights</span>
                      <Sparkles className="h-4 w-4" />
                    </div>
                  </button>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-500 text-center">
                    Both checklists follow the same quality verification workflow but with specific criteria for each service type.
                  </p>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
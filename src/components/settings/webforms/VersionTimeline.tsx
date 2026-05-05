'use client';

import Link from 'next/link';
import { WebFormDefinition } from '@/services/webFormsService';

interface VersionTimelineProps {
  versions: WebFormDefinition[];
  currentVersionId?: string;
}

const getVersionId = (version: WebFormDefinition): string =>
  String(version._id || version.id || version.versionId || '').trim();

export default function VersionTimeline({
  versions,
  currentVersionId,
}: VersionTimelineProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">Version History</h3>
      {versions.length === 0 ? (
        <p className="text-sm text-gray-500">No version history returned yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2 text-xs uppercase tracking-wide text-gray-500">
                  Version
                </th>
                <th className="text-left px-3 py-2 text-xs uppercase tracking-wide text-gray-500">
                  State
                </th>
                <th className="text-left px-3 py-2 text-xs uppercase tracking-wide text-gray-500">
                  Updated
                </th>
                <th className="text-left px-3 py-2 text-xs uppercase tracking-wide text-gray-500">
                  Open
                </th>
              </tr>
            </thead>
            <tbody>
              {versions.map((version, index) => {
                const versionId = getVersionId(version);
                const isCurrent = Boolean(
                  currentVersionId && versionId && currentVersionId === versionId
                );

                return (
                  <tr
                    key={`${versionId || 'version'}-${index}`}
                    className={`border-t border-gray-100 ${isCurrent ? 'bg-blue-50/70' : ''}`}
                  >
                    <td className="px-3 py-2 text-sm text-gray-800">
                      v{version.versionNumber || index + 1}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-800">{version.state || 'draft'}</td>
                    <td className="px-3 py-2 text-sm text-gray-800">
                      {new Date(
                        String(version.updatedAt || version.createdAt || Date.now())
                      ).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-800">
                      {isCurrent ? (
                        <span className="text-blue-700 font-medium">Current</span>
                      ) : versionId ? (
                        <Link
                          href={`/settings/webforms/${versionId}`}
                          className="text-blue-600 hover:text-blue-700 underline"
                        >
                          Open
                        </Link>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

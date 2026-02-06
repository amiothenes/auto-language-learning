// ============================================================================
// About Settings Page
// Application information, resources, and license
// ============================================================================

import { Github, Book, Bug, ExternalLink, FileText } from 'lucide-react';
import { SettingSection } from '@/components/settings/SettingSection';
import { SettingRow } from '@/components/settings/SettingRow';
import { Button } from '@/components/ui/Button';

export default function AboutSettingsPage() {
  return (
    <div className="space-y-6">
      {/* Application Information */}
      <SettingSection
        title="Application Information"
        description="Version and build details"
      >
        <SettingRow label="Version" description="Current application version">
          <span className="font-sans text-ui-base font-semibold text-ink">
            1.0.0
          </span>
        </SettingRow>

        <SettingRow label="Build Date" description="Last updated">
          <span className="font-sans text-ui-base font-semibold text-ink">
            2026-02-05
          </span>
        </SettingRow>

        <SettingRow label="Environment" description="Deployment environment">
          <span className="font-sans text-ui-base font-semibold text-ink">
            {process.env.NODE_ENV === 'production' ? 'Production' : 'Development'}
          </span>
        </SettingRow>
      </SettingSection>

      {/* Resources */}
      <SettingSection
        title="Resources"
        description="Documentation, support, and source code"
      >
        <div className="space-y-3">
          <a
            href="https://github.com/amiothenes/auto-language-learning"
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Button
              variant="ghost"
              size="md"
              leftIcon={<Github size={18} strokeWidth={2} />}
              rightIcon={<ExternalLink size={14} strokeWidth={2} />}
              className="w-full justify-between hover:bg-desk"
            >
              <span className="flex-1 text-left">GitHub Repository</span>
            </Button>
          </a>
          {/* TODO: change URL to actual docs page */}
          <a
            href="https://github.com/amiothenes/auto-language-learning" 
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Button
              variant="ghost"
              size="md"
              leftIcon={<Book size={18} strokeWidth={2} />}
              rightIcon={<ExternalLink size={14} strokeWidth={2} />}
              className="w-full justify-between hover:bg-desk"
            >
              <span className="flex-1 text-left">Documentation</span>
            </Button>
          </a>

          <a
            href="https://github.com/amiothenes/auto-language-learning/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Button
              variant="ghost"
              size="md"
              leftIcon={<Bug size={18} strokeWidth={2} />}
              rightIcon={<ExternalLink size={14} strokeWidth={2} />}
              className="w-full justify-between hover:bg-desk"
            >
              <span className="flex-1 text-left">Report an Issue</span>
            </Button>
          </a>
        </div>
      </SettingSection>

      {/* License */}
      <SettingSection title="License" description="Software license information">
        <div className="space-y-4">
          <SettingRow label="License Type" description="Open source license">
            <span className="font-sans text-ui-base font-semibold text-ink">
              MIT License
            </span>
          </SettingRow>

          <SettingRow label="Copyright" description="Software copyright">
            <span className="font-sans text-ui-base font-semibold text-ink">
              © 2026 Auto Language Learning
            </span>
          </SettingRow>

          <div className="pt-2">
            <a
              href="https://opensource.org/licenses/MIT"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<FileText size={16} strokeWidth={2} />}
                rightIcon={<ExternalLink size={12} strokeWidth={2} />}
                className="hover:bg-desk"
              >
                View Full License
              </Button>
            </a>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-border">
          <p className="font-sans text-ui-sm text-muted leading-relaxed">
            Permission is hereby granted, free of charge, to any person obtaining a copy
            of this software and associated documentation files, to deal in the Software
            without restriction, including without limitation the rights to use, copy,
            modify, merge, publish, distribute, sublicense, and/or sell copies of the
            Software.
          </p>
        </div>
      </SettingSection>

      {/* Tech Stack */}
      <SettingSection
        title="Built With"
        description="Technologies powering this application"
      >
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            'Next.js 15',
            'React 19',
            'TypeScript',
            'Tailwind CSS',
            'Lucide Icons',
          ].map((tech) => (
            <div
              key={tech}
              className="px-3 py-2 bg-desk border border-border rounded text-center"
            >
              <span className="font-sans text-ui-sm font-medium text-ink">
                {tech}
              </span>
            </div>
          ))}
        </div>
      </SettingSection>
    </div>
  );
}

import React, { useState, FormEvent } from 'react';

import { useBackend } from '@/hooks/useBackend';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
// import { DEFAULT_VALUE } from '@/components/input-amount';

export interface CreateDCAProps {
  onCreate?: () => void;
}

export const CreateDCA: React.FC<CreateDCAProps> = ({ onCreate }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [name] = useState<string>('LiquidationMonitor');
  const [usersToMonitorInput, setUsersToMonitorInput] = useState<string>(
    '0xE5ed485578d6a646D417002a06823584059FBe31'
  );
  const { createDCA } = useBackend();

  const handleCreateDCA = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const usersToMonitor = usersToMonitorInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s);
    if (!usersToMonitor.length) {
      alert('Please enter at least one user address to monitor.');
      return;
    }

    try {
      setLoading(true);
      await createDCA({ name, usersToMonitor });
      onCreate?.();
    } catch (error) {
      console.error('Error creating DCA:', error);
      alert('Error creating DCA. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-between">
      <form onSubmit={handleCreateDCA}>
        <div className="text-center space-y-6">
          <div className="space-y-4 text-left bg-orange-50/60 p-4 rounded-lg border border-orange-100">
            <h3
              className="text-sm font-semibold"
              style={{
                fontFamily: 'Poppins, system-ui, sans-serif',
                color: '#FF4205',
              }}
            >
              How It Works (Powered by Vincent)
            </h3>
            <p
              className="text-sm leading-relaxed"
              style={{
                fontFamily: '"Encode Sans Semi Expanded", system-ui, sans-serif',
                color: 'var(--footer-text-color, #121212)',
              }}
            >
              This DCA agent automatically purchases wBTC with a specific amount of USDC on your
              predefined schedule.
            </p>
            <p
              className="text-sm leading-relaxed"
              style={{
                fontFamily: '"Encode Sans Semi Expanded", system-ui, sans-serif',
                color: 'var(--footer-text-color, #121212)',
              }}
            >
              Typically, building automated crypto spending agents involves trusting agent
              developers or wallet SaaS companies for <strong>key management</strong>. Vincent
              enables a more secure and simpler process.
            </p>
            <p
              className="text-sm leading-relaxed"
              style={{
                fontFamily: '"Encode Sans Semi Expanded", system-ui, sans-serif',
                color: 'var(--footer-text-color, #121212)',
              }}
            >
              The agent operates using permissions securely delegated by you, following strict rules
              you establish during setup—such as authorized abilities. These onchain rules are
              cryptographically enforced by{' '}
              <a
                href="https://litprotocol.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:opacity-80"
                style={{ color: '#FF4205' }}
              >
                Lit Protocol
              </a>
              , ensuring every action stays within your guardrails. With Vincent, you achieve
              powerful automation combined with secure, permissioned execution.
            </p>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="my-8">
          <div className="flex flex-col gap-2 text-left">
            <label
              className="text-sm font-medium"
              style={{
                fontFamily: 'Poppins, system-ui, sans-serif',
                color: 'var(--footer-text-color, #121212)',
              }}
            >
              Users to monitor (comma-separated)
            </label>
            <input
              className="w-full h-10 rounded-md border px-3"
              placeholder="0xabc...,0xdef..."
              required
              value={usersToMonitorInput}
              onChange={(e) => setUsersToMonitorInput(e.target.value)}
              disabled={loading}
            />
            <div className="flex justify-end mt-4">
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={loading}
                className="sm:flex-shrink-0 whitespace-nowrap"
              >
                Create Monitor →
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

'use client';

import { ShareChatPage } from '@/pages/ShareChatPage';
import { use } from 'react';

export default function ShareChatPageRoute({
  params,
}: {
  params: Promise<{ versionId: string }>;
}) {
  const { versionId } = use(params);
  return <ShareChatPage versionId={versionId} />;
}


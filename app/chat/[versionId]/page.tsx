'use client';

import { ShareChatPage } from '@/pages/ShareChatPage';

export default function ShareChatPageRoute({
  params,
}: {
  params: { versionId: string };
}) {
  return <ShareChatPage versionId={params.versionId} />;
}


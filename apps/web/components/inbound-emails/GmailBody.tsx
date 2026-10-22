'use client';

import { useCallback, useRef, useState } from 'react';
import { buildEmailIframeDocument } from './gmail-body-utils';

type GmailBodyProps = {
	html: string;
};

const MIN_IFRAME_HEIGHT = 120;

function GmailBodyFrame({ html }: GmailBodyProps) {
	const iframeRef = useRef<HTMLIFrameElement>(null);
	const [height, setHeight] = useState(MIN_IFRAME_HEIGHT);

	const resizeIframe = useCallback(() => {
		const doc = iframeRef.current?.contentDocument;
		if (!doc) return;
		const nextHeight = Math.max(
			doc.documentElement?.scrollHeight ?? 0,
			doc.body?.scrollHeight ?? 0,
			MIN_IFRAME_HEIGHT
		);
		setHeight(nextHeight);
	}, []);

	return (
		<div className='overflow-hidden rounded-lg border bg-white'>
			<iframe
				ref={iframeRef}
				title='Email message'
				sandbox='allow-popups allow-popups-to-escape-sandbox allow-same-origin'
				srcDoc={buildEmailIframeDocument(html)}
				className='w-full border-0 bg-white'
				style={{ height }}
				onLoad={resizeIframe}
			/>
		</div>
	);
}

export default function GmailBody({ html }: GmailBodyProps) {
	return <GmailBodyFrame key={html} html={html} />;
}

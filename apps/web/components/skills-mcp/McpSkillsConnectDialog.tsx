'use client';

import { tooltips } from '@repo/constants';
import { Button } from '@repo/ui/components/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@repo/ui/components/dialog';
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from '@repo/ui/components/tabs';
import { Download, ExternalLink, Info, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import CustomTooltip from '@/components/general/CustomTooltip';
import { envConfig } from '@/env-config';
import { SkillsService } from '@/services';
import { CopyableCode, Step } from './dialog-shared';
import {
	type DialogSearchParam,
	useDialogSearchParam,
} from './use-dialog-search-param';

/**
 * `?mcp=connect` opens this dialog. `?skill=add` is kept as an alias so links
 * shared before the connect and skill dialogs were merged still resolve.
 */
export const CONNECT_PARAMS: DialogSearchParam[] = [
	{ param: 'mcp', value: 'connect' },
	{ param: 'skill', value: 'add' },
];

/** The only place the skill's folder name lives; the route takes it as a slug. */
const SKILL_NAME = 'sauerobase';

/** One-line explanation shown behind the info icon on the skill step. */
interface McpSkillsConnectDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

/**
 * Downloads the skill zip via ApiClient so the browser honours the filename on
 * cross-origin responses — the `download` attribute on <a> tags is ignored
 * for cross-origin URLs by all major browsers.
 */
function useSkillDownload() {
	const [downloading, setDownloading] = useState(false);

	async function downloadSkill() {
		if (downloading) return;
		setDownloading(true);
		try {
			const blob = await SkillsService.downloadSkillZip(SKILL_NAME);
			const objectUrl = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = objectUrl;
			link.download = `${SKILL_NAME}.zip`;
			link.click();
			URL.revokeObjectURL(objectUrl);
		} catch (error) {
			console.error('Skill download failed:', error);
		} finally {
			setDownloading(false);
		}
	}

	return { downloadSkill, downloading };
}

const SkillDownloadButton = () => {
	const { downloadSkill, downloading } = useSkillDownload();
	return (
		<Button
			size='sm'
			variant='outline'
			className='w-full sm:w-auto'
			disabled={downloading}
			onClick={() => void downloadSkill()}
		>
			<Download className='size-4' />
			{downloading ? 'Downloading…' : `Download ${SKILL_NAME}.zip`}
		</Button>
	);
};

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
	<p className='text-xs font-medium text-muted-foreground'>{children}</p>
);

/** Section label with the skill's own description behind an info icon. */
const SkillSectionLabel = ({ children }: { children: React.ReactNode }) => (
	<div className='flex items-center gap-1.5'>
		<SectionLabel>{children}</SectionLabel>
		<CustomTooltip
			content={tooltips.mcpConnect.skills}
			className='leading-relaxed'
		>
			<Info className='size-3.5 text-muted-foreground' />
		</CustomTooltip>
	</div>
);

export const McpSkillsConnectDialog = ({
	open,
	onOpenChange,
}: McpSkillsConnectDialogProps) => {
	const { mcpUrl } = envConfig;

	useDialogSearchParam({ params: CONNECT_PARAMS, open, onOpenChange });

	const cursorConfig = `{
  "mcpServers": {
    "sauero": { "url": "${mcpUrl}" }
  }
}`;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='sm:max-w-2xl'>
				<DialogHeader>
					<DialogTitle>Connect to MCP</DialogTitle>
					<DialogDescription>
						Sauero&apos;s centralized reporting hub — connect Claude, Cursor, or
						any MCP client and ask questions about anything across the platform
						in plain English.
					</DialogDescription>
				</DialogHeader>

				<div className='space-y-4'>
					<div className='space-y-1.5'>
						<SectionLabel>MCP server URL</SectionLabel>
						<CopyableCode value={mcpUrl} />
					</div>

					<Tabs defaultValue='claude'>
						<TabsList className='w-full'>
							<TabsTrigger value='claude' className='flex-1'>
								Claude.ai
							</TabsTrigger>
							<TabsTrigger value='claude-code' className='flex-1'>
								Claude Code
							</TabsTrigger>
							<TabsTrigger value='cursor' className='flex-1'>
								Cursor
							</TabsTrigger>
						</TabsList>

						{/* ── Claude.ai ─────────────────────────────────────────────── */}
						<TabsContent value='claude' className='mt-3 space-y-4'>
							<div className='space-y-2'>
								<SectionLabel>1 · Connect the server</SectionLabel>
								<ol className='space-y-2.5'>
									<Step index={1}>
										Open{' '}
										<span className='font-medium'>
											Settings → Customize → Connectors → Add custom connector
										</span>
										.
									</Step>
									<Step index={2}>
										Paste the MCP server URL above and save.
									</Step>
									<Step index={3}>
										Claude opens a browser window for Sauero login and consent.
									</Step>
								</ol>
							</div>

							<div className='space-y-2 border-t pt-3'>
								<SkillSectionLabel>
									2 · Add the skill (optional but recommended)
								</SkillSectionLabel>
								<ol className='space-y-2.5'>
									<Step index={4}>
										In{' '}
										<span className='font-medium'>Settings → Capabilities</span>
										, turn on code execution / file creation if they are off
										(labels move; custom skills need them).
									</Step>
									<Step index={5}>Download the skill package:</Step>
								</ol>
								<div className='pl-8'>
									<SkillDownloadButton />
								</div>
								<ol className='space-y-2.5'>
									<Step index={6}>
										Open{' '}
										<span className='font-medium'>
											Settings → Capabilities → Skills
										</span>{' '}
										(or <span className='font-medium'>Customize → Skills</span>)
										and <span className='font-medium'>Upload</span> the zip,
										then toggle it on.
									</Step>
									<Step index={7}>
										Start a <span className='font-medium'>new</span> chat before
										asking Sauero questions.
									</Step>
								</ol>
								<p className='text-[13px] text-muted-foreground'>
									The zip contains the{' '}
									<code className='font-mono text-xs'>{SKILL_NAME}/</code>{' '}
									folder at its root. If Claude cannot find{' '}
									<code className='font-mono text-xs'>SKILL.md</code>,
									re-download rather than unzipping and re-zipping.
								</p>
							</div>
						</TabsContent>

						{/* ── Claude Code ───────────────────────────────────────────── */}
						<TabsContent value='claude-code' className='mt-3 space-y-4'>
							<div className='space-y-2'>
								<SectionLabel>1 · Connect the server</SectionLabel>
								<CopyableCode
									value={`claude mcp add --transport http sauero ${mcpUrl}`}
								/>
							</div>

							<div className='space-y-2 border-t pt-3'>
								<SkillSectionLabel>
									2 · Add the skill (optional but recommended)
								</SkillSectionLabel>
								<SkillDownloadButton />
								<p className='text-sm text-muted-foreground'>
									Unzip it and move the{' '}
									<code className='font-mono text-xs'>{SKILL_NAME}</code> folder
									into your skills directory, then restart Claude Code:
								</p>
								<CopyableCode value='~/.claude/skills/' />
								<p className='text-[13px] text-muted-foreground'>
									A project-level{' '}
									<code className='font-mono text-xs'>.claude/skills/</code>{' '}
									folder works too if you would rather scope it to one repo.
								</p>
							</div>
						</TabsContent>

						{/* ── Cursor ────────────────────────────────────────────────── */}
						<TabsContent value='cursor' className='mt-3 space-y-4'>
							<div className='space-y-2'>
								<SectionLabel>1 · Connect the server</SectionLabel>
								<p className='text-sm text-muted-foreground'>
									Add to{' '}
									<code className='font-mono text-xs'>.cursor/mcp.json</code>:
								</p>
								<CopyableCode value={cursorConfig} />
							</div>

							<div className='space-y-2 border-t pt-3'>
								<SectionLabel>2 · Add the skill (Claude only)</SectionLabel>
								<p className='text-sm text-muted-foreground'>
									Skills are a Claude feature, so there is nothing to install
									here. The tools work the same; answers just will not carry
									Sauero&apos;s metric definitions and caveats.
								</p>
							</div>
						</TabsContent>
					</Tabs>

					<div className='flex gap-2 rounded-lg border bg-muted/40 p-2.5'>
						<ShieldCheck className='mt-0.5 size-4 shrink-0 text-muted-foreground' />
						<p className='text-[13px] text-muted-foreground'>
							Sign in with your existing Sauero account — Google or email OTP.
							Access tokens are stored by your AI client and are never shared
							with anyone else.
						</p>
					</div>
				</div>

				<div className='flex items-center justify-between border-t pt-3'>
					<div className='flex items-center gap-4'>
						<a
							href='https://modelcontextprotocol.io/'
							target='_blank'
							rel='noopener noreferrer'
							className='inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline'
						>
							<ExternalLink className='size-3' />
							What is MCP?
						</a>
						<a
							href='https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview'
							target='_blank'
							rel='noopener noreferrer'
							className='inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline'
						>
							<ExternalLink className='size-3' />
							What are skills?
						</a>
					</div>
					<Button
						size='sm'
						variant='outline'
						onClick={() => onOpenChange(false)}
					>
						Done
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default McpSkillsConnectDialog;

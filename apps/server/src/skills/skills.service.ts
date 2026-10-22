import { readdir, readFile, stat } from 'node:fs/promises';
import { basename, dirname, join, posix, resolve, sep } from 'node:path';
import {
	Injectable,
	InternalServerErrorException,
	Logger,
	NotFoundException,
} from '@nestjs/common';
import JSZip from 'jszip';

/**
 * Skills live under `skills/` at the monorepo root.
 * Four levels up from `__dirname` (src/skills or dist/skills) reaches the root:
 *   src/skills → src → apps/server → apps → repo root
 *   dist/skills → dist → apps/server → apps → repo root
 */
const SKILLS_ROOT = join(__dirname, '..', '..', '..', '..', 'skills');

/** Editor and OS cruft that should never ship inside a zip. */
function isIgnored(name: string): boolean {
	return name.startsWith('.');
}

/** Every file under `dir`, as paths relative to it, sorted for a stable zip. */
async function walk(dir: string, prefix = ''): Promise<string[]> {
	const entries = await readdir(dir, { withFileTypes: true });
	const files = await Promise.all(
		entries
			.filter((entry) => !isIgnored(entry.name))
			.map(async (entry) => {
				const relative = prefix ? join(prefix, entry.name) : entry.name;
				if (entry.isDirectory()) {
					return walk(join(dir, entry.name), relative);
				}
				return entry.isFile() ? [relative] : [];
			})
	);
	return files.flat().sort();
}

/**
 * Resolves a slug to a directory under SKILLS_ROOT, refusing anything that is
 * not a direct child — the slug reaches us from the URL, so `..` and absolute
 * paths must never escape the skills folder.
 */
async function resolveSkillDir(slug: string): Promise<string | null> {
	const target = resolve(SKILLS_ROOT, slug);
	const root = resolve(SKILLS_ROOT);

	if (dirname(target) !== root || isIgnored(basename(target))) {
		return null;
	}

	const fileStat = await stat(target).catch(() => null);
	return fileStat?.isDirectory() ? target : null;
}

@Injectable()
export class SkillsService {
	private readonly logger = new Logger(SkillsService.name);

	/**
	 * Builds a zip buffer for the named skill folder.
	 *
	 * Claude requires `SKILL.md` to be inside a folder named after the skill, so
	 * the zip root is the folder itself rather than its contents — matching the
	 * original Next.js implementation.
	 *
	 * @throws NotFoundException  if the slug doesn't map to a valid skill folder
	 * @throws InternalServerErrorException  if the filesystem read fails
	 */
	async buildSkillZip(slug: string): Promise<Buffer> {
		let skillDir: string | null;
		try {
			skillDir = await resolveSkillDir(slug);
		} catch (error) {
			this.logger.error({ slug, error }, 'Failed to resolve skill directory');
			throw new InternalServerErrorException('Failed to locate skill');
		}

		if (!skillDir) {
			throw new NotFoundException(`Skill '${slug}' not found`);
		}

		let files: string[];
		try {
			files = await walk(skillDir);
		} catch (error) {
			this.logger.error(
				{ slug, skillDir, error },
				'Failed to walk skill directory'
			);
			throw new InternalServerErrorException('Failed to read skill files');
		}

		if (files.length === 0) {
			throw new NotFoundException(`Skill '${slug}' is empty`);
		}

		const zip = new JSZip();
		for (const relative of files) {
			zip.file(
				posix.join(slug, ...relative.split(sep)),
				await readFile(join(skillDir, relative))
			);
		}

		const buffer = await zip.generateAsync({
			type: 'nodebuffer',
			compression: 'DEFLATE',
		});

		return buffer as Buffer;
	}
}

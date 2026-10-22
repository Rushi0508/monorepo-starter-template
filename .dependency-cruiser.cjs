/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
	forbidden: [
		{
			name: 'apps-cannot-import-other-apps',
			comment:
				'Apps share code through packages/*, never by importing each other.',
			severity: 'error',
			from: { path: '^apps/([^/]+)/' },
			to: { path: '^apps/', pathNot: '^apps/$1/' },
		},
		{
			name: 'packages-cannot-import-apps',
			comment: 'Packages are shared by the apps, so they cannot depend on one.',
			severity: 'error',
			from: { path: '^packages/' },
			to: { path: '^apps/' },
		},
		{
			name: 'web-cannot-import-db',
			comment: 'The web app reads data through the API, not the database.',
			severity: 'error',
			from: { path: '^(apps/web|packages/ui)/' },
			to: {
				path: '^packages/db/|node_modules/@prisma/',
				dependencyTypesNot: ['type-only'],
			},
		},
		{
			name: 'controllers-cannot-import-prisma',
			comment: 'Controllers go through a service; only services touch Prisma.',
			severity: 'error',
			from: { path: '^apps/server/src/.+\\.controller\\.ts$' },
			to: { path: '^apps/server/src/prisma/' },
		},
		{
			name: 'no-circular-imports',
			comment: 'Circular imports break module initialisation order.',
			severity: 'error',
			from: {},
			to: {
				circular: true,
				viaOnly: { dependencyTypesNot: ['type-only'] },
			},
		},
		{
			name: 'imports-must-resolve',
			comment:
				'An import that does not resolve is a typo or a missing package.',
			severity: 'error',
			from: {},
			to: { couldNotResolve: true },
		},
		{
			name: 'shipped-code-cannot-import-dev-deps',
			comment:
				'Shipped code cannot rely on a package that is only a devDependency.',
			severity: 'error',
			from: {
				path: '^(apps|packages)/',
				pathNot: [
					'\\.(spec|test)\\.[jt]sx?$',
					'/test/',
					'/scripts/',
					'\\.config\\.[cm]?[jt]s$',
					'jest\\.setup\\.ts$',
				],
			},
			to: {
				dependencyTypes: ['npm-dev'],
				dependencyTypesNot: ['type-only'],
				pathNot: ['node_modules/@types/'],
			},
		},
	],
	options: {
		doNotFollow: { path: ['node_modules', '^packages/db/generated/'] },
		exclude: {
			path: '(^|/)(node_modules|dist|\\.next|\\.turbo)/',
		},
		tsPreCompilationDeps: true,
		combinedDependencies: true,
		tsConfig: { fileName: 'tsconfig.depcruise.json' },
		enhancedResolveOptions: {
			exportsFields: ['exports'],
			conditionNames: ['import', 'require', 'node', 'default', 'types'],
			mainFields: ['module', 'main', 'types', 'typings'],
		},
		reporterOptions: {
			text: { highlightFocused: true },
		},
	},
};

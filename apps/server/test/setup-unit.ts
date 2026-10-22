// Global Jest setup for mocking common dependencies

// Prevent real nodemailer/pool side-effects during unit tests
jest.mock('@repo/mail/', () => ({
	sendMail: jest.fn().mockResolvedValue(undefined),
	emailUserCreateTemplate: jest.fn().mockReturnValue({
		subject: 'subject',
		text: 'text',
		html: '<p>html</p>',
	}),
}));

// Mock Logger globally to ensure 100% coverage
const mockLogger = {
	log: jest.fn(),
	error: jest.fn(),
	warn: jest.fn(),
	debug: jest.fn(),
	verbose: jest.fn(),
};

// Mock Logger constructor while preserving NestJS testing functionality
jest.mock('@nestjs/common', () => {
	const actual = jest.requireActual('@nestjs/common');
	return {
		...actual,
		Logger: Object.assign(
			jest.fn().mockImplementation(() => mockLogger),
			{
				overrideLogger: jest.fn(),
				setLogger: jest.fn(),
				getLogger: jest.fn().mockReturnValue(mockLogger),
			}
		),
	};
});

// Global setup to spy on logger methods after service instantiation
beforeEach(() => {
	// This will be called before each test
	jest.clearAllMocks();
});

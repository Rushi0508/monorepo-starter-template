const mockLogger = {
	log: jest.fn(),
	error: jest.fn(),
	warn: jest.fn(),
	debug: jest.fn(),
	verbose: jest.fn(),
};

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

beforeEach(() => {
	jest.clearAllMocks();
});

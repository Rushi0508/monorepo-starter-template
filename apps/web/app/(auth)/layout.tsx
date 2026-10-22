const AuthLayout = ({ children }: { children: React.ReactNode }) => (
	<main className='bg-muted/40 flex min-h-dvh w-full items-center justify-center p-4'>
		{children}
	</main>
);

export default AuthLayout;

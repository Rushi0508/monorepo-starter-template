import { UsersTable } from '@/components/users/UsersTable';

export default function HomePage() {
	return (
		<div className='flex flex-col gap-6'>
			<div>
				<h1 className='text-2xl font-semibold tracking-tight'>Users</h1>
				<p className='text-muted-foreground text-sm'>
					Everyone who has signed in to this app.
				</p>
			</div>
			<UsersTable />
		</div>
	);
}

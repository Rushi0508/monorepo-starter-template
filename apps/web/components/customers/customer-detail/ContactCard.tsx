import type { GetCustomerDetailResponseType } from '@repo/types';
import { Separator } from '@repo/ui/components/separator';
import {
	ExternalLink,
	Mail,
	MapPin,
	MessageSquare,
	Phone,
	User,
} from 'lucide-react';
import { folkCompanyUrl } from '@/utils/get-urls';

interface ContactCardProps {
	customer: GetCustomerDetailResponseType;
}

type AddressType = NonNullable<GetCustomerDetailResponseType['defaultAddress']>;

export const formatAddress = (addr: AddressType): string[] => {
	const lines: string[] = [];

	if (addr.address1) lines.push(addr.address1);
	if (addr.address2) lines.push(addr.address2);

	const cityLine = [addr.city, addr.province, addr.zip]
		.filter(Boolean)
		.join(', ');
	if (cityLine) lines.push(cityLine);

	if (addr.country && addr.countryCode !== 'US') lines.push(addr.country);

	return lines;
};

/** Label/value row for the Folk block, labelled with Folk's own field names. */
const FolkField = ({ label, value }: { label: string; value: string }) => (
	<div className='flex items-start justify-between gap-2.5 text-muted-foreground'>
		<span>{label}</span>
		<span className='text-right text-foreground'>{value}</span>
	</div>
);

const ContactCard = ({ customer }: ContactCardProps) => {
	const addressLines = customer.defaultAddress
		? formatAddress(customer.defaultAddress)
		: [];

	const folkCardUrl =
		customer.folkGroupId && customer.folkCompanyId
			? folkCompanyUrl(customer.folkGroupId, customer.folkCompanyId)
			: null;

	const hasContactInfo = Boolean(
		customer.email ||
			customer.phone ||
			addressLines.length > 0 ||
			customer.note ||
			customer.tags.length > 0
	);

	// The Folk block owns its own visibility, so the contact empty state stays
	// about contact info and the separator only appears when there is a block
	// under it to separate.
	const hasFolkDetails = Boolean(
		customer.folkPipelineStatus ||
			customer.folkCustomerType ||
			customer.folkLastContactAt ||
			folkCardUrl
	);

	const lastContact = customer.folkLastContactAt
		? [
				new Date(customer.folkLastContactAt).toLocaleDateString(),
				customer.folkLastContactType,
			]
				.filter(Boolean)
				.join(' · ')
		: null;

	return (
		<div className='rounded-xl border bg-card p-5 space-y-4'>
			<p className='flex items-center gap-2 text-sm font-semibold'>
				<span className='flex size-6 items-center justify-center rounded-full bg-muted'>
					<User className='size-3.5' />
				</span>
				Contact
			</p>

			<div className='space-y-2.5 text-sm'>
				{customer.email && (
					<div className='flex items-start gap-2.5 text-muted-foreground'>
						<Mail className='mt-0.5 size-3.5 shrink-0' />
						<span className='break-all'>{customer.email}</span>
					</div>
				)}
				{customer.phone && (
					<div className='flex items-start gap-2.5 text-muted-foreground'>
						<Phone className='mt-0.5 size-3.5 shrink-0' />
						<span>{customer.phone}</span>
					</div>
				)}
				{addressLines.length > 0 && (
					<div className='flex items-start gap-2.5 text-muted-foreground'>
						<MapPin className='mt-0.5 size-3.5 shrink-0' />
						<div className='space-y-0.5'>
							{addressLines.map((line, index) => (
								<p key={line + index}>{line}</p>
							))}
						</div>
					</div>
				)}
				{customer.note && (
					<div className='flex items-start gap-2.5 text-muted-foreground'>
						<MessageSquare className='mt-0.5 size-3.5 shrink-0' />
						<span className='leading-relaxed whitespace-pre-wrap'>
							{customer.note}
						</span>
					</div>
				)}
				{customer.tags.length > 0 && (
					<div className='flex flex-wrap gap-1.5 pt-0.5'>
						{customer.tags.map((tag) => (
							<span
								key={tag}
								className='inline-flex items-center rounded-md border bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground'
							>
								{tag}
							</span>
						))}
					</div>
				)}
				{!hasContactInfo && (
					<p className='text-muted-foreground'>No contact info available</p>
				)}
			</div>

			{hasFolkDetails && (
				<>
					<Separator />

					<div className='space-y-2.5 text-sm'>
						<div className='flex items-center justify-between'>
							<p className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
								Folk Details
							</p>
							{folkCardUrl && (
								<a
									href={folkCardUrl}
									target='_blank'
									rel='noreferrer'
									className='text-blue-600 hover:underline flex items-center gap-1 justify-end'
								>
									<ExternalLink className='size-3.5' />
									Open in Folk
								</a>
							)}
						</div>

						{customer.folkPipelineStatus && (
							<FolkField label='Status' value={customer.folkPipelineStatus} />
						)}
						{customer.folkCustomerType && (
							<FolkField
								label='Account Type'
								value={customer.folkCustomerType}
							/>
						)}
						{lastContact && (
							<FolkField label='Last Contact' value={lastContact} />
						)}
					</div>
				</>
			)}
		</div>
	);
};

export default ContactCard;

import { useCallback, useEffect, useRef, useState } from 'react';

const COOLDOWN_SECONDS = 60;

export function useResendCooldown() {
	const [secondsLeft, setSecondsLeft] = useState(0);
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const startCooldown = useCallback(() => {
		setSecondsLeft(COOLDOWN_SECONDS);

		if (intervalRef.current) clearInterval(intervalRef.current);

		intervalRef.current = setInterval(() => {
			setSecondsLeft((prev) => {
				if (prev <= 1) {
					if (intervalRef.current) clearInterval(intervalRef.current);
					intervalRef.current = null;
					return 0;
				}
				return prev - 1;
			});
		}, 1000);
	}, []);

	useEffect(() => {
		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current);
		};
	}, []);

	return { secondsLeft, isCooldown: secondsLeft > 0, startCooldown };
}

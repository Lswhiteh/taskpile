import { useEffect, useRef } from "react";

export function useAnimationFrame(callback: (dt: number) => void): void {
	const callbackRef = useRef(callback);
	callbackRef.current = callback;

	useEffect(() => {
		let rafId: number;
		let lastTime = performance.now();

		function loop(time: number) {
			const dt = time - lastTime;
			lastTime = time;
			callbackRef.current(dt);
			rafId = requestAnimationFrame(loop);
		}

		rafId = requestAnimationFrame(loop);
		return () => cancelAnimationFrame(rafId);
	}, []);
}

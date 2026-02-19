import { useEffect, useState } from "react";
import type { WorldBounds } from "../types/physics.js";

export function useCanvasSize(
	containerRef: React.RefObject<HTMLDivElement | null>,
): WorldBounds {
	const [bounds, setBounds] = useState<WorldBounds>({
		width: window.innerWidth,
		height: window.innerHeight,
	});

	useEffect(() => {
		const el = containerRef.current;
		if (!el) return;

		const observer = new ResizeObserver((entries) => {
			for (const entry of entries) {
				const { width, height } = entry.contentRect;
				setBounds({ width, height });
			}
		});

		observer.observe(el);
		return () => observer.disconnect();
	}, [containerRef]);

	return bounds;
}

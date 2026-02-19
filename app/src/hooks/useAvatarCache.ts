import { useEffect, useRef } from "react";
import type { LinearIssue } from "../types/linear.js";

export function useAvatarCache(
	issues: LinearIssue[],
): Map<string, HTMLImageElement> {
	const cacheRef = useRef(new Map<string, HTMLImageElement>());

	useEffect(() => {
		const urls = new Set<string>();
		for (const issue of issues) {
			if (issue.assignee?.avatarUrl) {
				urls.add(issue.assignee.avatarUrl);
			}
		}

		for (const url of urls) {
			if (cacheRef.current.has(url)) continue;

			const img = new Image();
			img.crossOrigin = "anonymous";
			img.src = url;
			img.onload = () => {
				cacheRef.current.set(url, img);
			};
		}
	}, [issues]);

	return cacheRef.current;
}

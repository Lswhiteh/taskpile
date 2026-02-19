import { queryOptions } from "@tanstack/react-query";
import type {
	LinearCycle,
	LinearIssue,
	LinearProject,
	LinearTeam,
} from "../types/linear.js";
import { linearGql } from "./linearClient.js";

export function teamsQuery() {
	return queryOptions({
		queryKey: ["teams"],
		queryFn: async (): Promise<LinearTeam[]> => {
			const data = await linearGql<{
				teams: { nodes: LinearTeam[] };
			}>("query { teams { nodes { id name key } } }");
			return data.teams.nodes;
		},
		staleTime: 5 * 60 * 1000,
	});
}

export function cyclesQuery(teamId: string) {
	return queryOptions({
		queryKey: ["cycles", teamId],
		queryFn: async (): Promise<LinearCycle[]> => {
			const data = await linearGql<{
				team: {
					cycles: {
						nodes: { id: string; name: string | null; number: number }[];
					};
				};
			}>(
				`query($teamId: String!) {
					team(id: $teamId) {
						cycles { nodes { id name number } }
					}
				}`,
				{ teamId },
			);
			return data.team.cycles.nodes;
		},
		enabled: !!teamId,
		staleTime: 5 * 60 * 1000,
	});
}

export function projectsQuery(teamId: string) {
	return queryOptions({
		queryKey: ["projects", teamId],
		queryFn: async (): Promise<LinearProject[]> => {
			const data = await linearGql<{
				team: { projects: { nodes: LinearProject[] } };
			}>(
				`query($teamId: String!) {
					team(id: $teamId) {
						projects { nodes { id name } }
					}
				}`,
				{ teamId },
			);
			return data.team.projects.nodes;
		},
		enabled: !!teamId,
		staleTime: 5 * 60 * 1000,
	});
}

export function issuesQuery(filters: {
	teamId: string;
	cycleId?: string;
	projectId?: string;
}) {
	return queryOptions({
		queryKey: ["issues", filters],
		queryFn: async (): Promise<LinearIssue[]> => {
			const filter: Record<string, unknown> = {
				team: { id: { eq: filters.teamId } },
			};
			if (filters.cycleId) {
				filter.cycle = { id: { eq: filters.cycleId } };
			}
			if (filters.projectId) {
				filter.project = { id: { eq: filters.projectId } };
			}

			const data = await linearGql<{
				issues: {
					nodes: {
						id: string;
						identifier: string;
						title: string;
						priority: number;
						estimate: number | null;
						assignee: {
							id: string;
							name: string;
							avatarUrl: string | null;
						} | null;
						state: {
							name: string;
							color: string;
							type: string;
						};
						labels: {
							nodes: { name: string; color: string }[];
						};
					}[];
				};
			}>(
				`query($filter: IssueFilter) {
					issues(filter: $filter, first: 100) {
						nodes {
							id identifier title priority estimate
							assignee { id name avatarUrl }
							state { name color type }
							labels { nodes { name color } }
						}
					}
				}`,
				{ filter },
			);

			return data.issues.nodes.map((issue) => ({
				...issue,
				labels: issue.labels.nodes,
			}));
		},
		enabled: !!filters.teamId,
		staleTime: 2 * 60 * 1000,
	});
}

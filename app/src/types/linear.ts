export interface LinearIssue {
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
	labels: { name: string; color: string }[];
}

export interface LinearTeam {
	id: string;
	name: string;
	key: string;
}

export interface LinearCycle {
	id: string;
	name: string | null;
	number: number;
}

export interface LinearProject {
	id: string;
	name: string;
}

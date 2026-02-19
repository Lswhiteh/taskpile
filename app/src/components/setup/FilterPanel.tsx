import { useQuery } from "@tanstack/react-query";
import { cyclesQuery, projectsQuery, teamsQuery } from "../../api/queries.js";

interface FilterPanelProps {
	teamId: string;
	cycleId: string;
	projectId: string;
	onTeamChange: (id: string) => void;
	onCycleChange: (id: string) => void;
	onProjectChange: (id: string) => void;
}

const selectStyle: React.CSSProperties = {
	background: "#111122",
	color: "#e0e0e0",
	border: "1px solid #333",
	borderRadius: "8px",
	padding: "10px 14px",
	fontSize: "14px",
	width: "100%",
	outline: "none",
	transition: "border-color 0.15s",
};

const labelStyle: React.CSSProperties = {
	display: "block",
	marginBottom: "6px",
	fontSize: "12px",
	color: "#888",
	textTransform: "uppercase",
	letterSpacing: "0.5px",
	fontWeight: 600,
};

function focusSelect(e: React.FocusEvent<HTMLSelectElement>) {
	e.currentTarget.style.borderColor = "#6366f1";
}
function blurSelect(e: React.FocusEvent<HTMLSelectElement>) {
	e.currentTarget.style.borderColor = "#333";
}

export function FilterPanel({
	teamId,
	cycleId,
	projectId,
	onTeamChange,
	onCycleChange,
	onProjectChange,
}: FilterPanelProps) {
	const { data: teams, isLoading: teamsLoading } = useQuery(teamsQuery());
	const { data: cycles } = useQuery(cyclesQuery(teamId));
	const { data: projects } = useQuery(projectsQuery(teamId));

	if (teamsLoading) {
		return (
			<div
				style={{
					color: "#6366f1",
					fontSize: "14px",
					padding: "8px 0",
					fontWeight: 600,
				}}
			>
				Loading teams...
			</div>
		);
	}

	return (
		<div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
			<div>
				<label htmlFor="filter-team" style={labelStyle}>
					Team
				</label>
				<select
					id="filter-team"
					style={selectStyle}
					value={teamId}
					onChange={(e) => {
						onTeamChange(e.target.value);
						onCycleChange("");
						onProjectChange("");
					}}
					onFocus={focusSelect}
					onBlur={blurSelect}
				>
					<option value="">Select team...</option>
					{teams?.map((t) => (
						<option key={t.id} value={t.id}>
							{t.name}
						</option>
					))}
				</select>
			</div>

			{teamId && (
				<>
					<div>
						<label htmlFor="filter-cycle" style={labelStyle}>
							Cycle (optional)
						</label>
						<select
							id="filter-cycle"
							style={selectStyle}
							value={cycleId}
							onChange={(e) => onCycleChange(e.target.value)}
							onFocus={focusSelect}
							onBlur={blurSelect}
						>
							<option value="">All cycles</option>
							{cycles?.map((c) => (
								<option key={c.id} value={c.id}>
									{c.name ?? `Cycle ${c.number}`}
								</option>
							))}
						</select>
					</div>

					<div>
						<label htmlFor="filter-project" style={labelStyle}>
							Project (optional)
						</label>
						<select
							id="filter-project"
							style={selectStyle}
							value={projectId}
							onChange={(e) => onProjectChange(e.target.value)}
							onFocus={focusSelect}
							onBlur={blurSelect}
						>
							<option value="">All projects</option>
							{projects?.map((p) => (
								<option key={p.id} value={p.id}>
									{p.name}
								</option>
							))}
						</select>
					</div>
				</>
			)}
		</div>
	);
}

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { issuesQuery } from "../api/queries.js";
import { FilterPanel } from "../components/setup/FilterPanel.js";
import { ModeSelector } from "../components/setup/ModeSelector.js";
import type { GameMode } from "../types/game.js";

export function SetupPage() {
	const navigate = useNavigate();
	const [teamId, setTeamId] = useState("");
	const [cycleId, setCycleId] = useState("");
	const [projectId, setProjectId] = useState("");
	const [mode, setMode] = useState<GameMode>("freePlay");

	const { data: issues, isLoading: issuesLoading } = useQuery(
		issuesQuery({
			teamId,
			cycleId: cycleId || undefined,
			projectId: projectId || undefined,
		}),
	);

	const canLaunch = teamId && issues && issues.length > 0;

	function handleLaunch() {
		if (!canLaunch) return;
		sessionStorage.setItem("taskpile_game", JSON.stringify({ issues, mode }));
		navigate("/play");
	}

	return (
		<div
			className="tp-setup"
			style={{
				maxWidth: "720px",
				margin: "0 auto",
				padding: "48px 24px 80px",
				display: "flex",
				flexDirection: "column",
				gap: "28px",
			}}
		>
			{/* Responsive overrides */}
			<style>
				{`
					@media (max-width: 600px) {
						.tp-setup { padding: 24px 16px 60px !important; gap: 20px !important; }
						.tp-setup h2 { font-size: 24px !important; }
						.tp-setup-card { padding: 16px !important; }
						.tp-launch-btn { width: 100% !important; align-self: stretch !important; }
					}
				`}
			</style>

			{/* Header */}
			<div>
				<h2 style={{ fontSize: "28px", fontWeight: 800, marginBottom: "6px" }}>
					Game Setup
				</h2>
				<p style={{ color: "#666", fontSize: "15px" }}>
					Pick a team, choose your mode, and launch into the chaos.
				</p>
			</div>

			{/* Filters card */}
			<div
				className="tp-setup-card"
				style={{
					background: "#1a1a2e",
					borderRadius: "14px",
					border: "1px solid #222244",
					padding: "24px",
				}}
			>
				<h3
					style={{
						fontSize: "13px",
						fontWeight: 700,
						color: "#888",
						textTransform: "uppercase",
						letterSpacing: "0.06em",
						marginBottom: "16px",
					}}
				>
					Issues
				</h3>
				<FilterPanel
					teamId={teamId}
					cycleId={cycleId}
					projectId={projectId}
					onTeamChange={setTeamId}
					onCycleChange={setCycleId}
					onProjectChange={setProjectId}
				/>
				{teamId && (
					<div
						style={{
							marginTop: "16px",
							display: "inline-block",
							padding: "4px 12px",
							borderRadius: "8px",
							fontSize: "13px",
							fontWeight: 600,
							background: issuesLoading
								? "rgba(136, 136, 136, 0.12)"
								: "rgba(99, 102, 241, 0.12)",
							color: issuesLoading ? "#888" : "#6366f1",
						}}
					>
						{issuesLoading
							? "Loading issues..."
							: `${issues?.length ?? 0} issues found`}
					</div>
				)}
			</div>

			{/* Game mode card */}
			<div
				className="tp-setup-card"
				style={{
					background: "#1a1a2e",
					borderRadius: "14px",
					border: "1px solid #222244",
					padding: "24px",
				}}
			>
				<h3
					style={{
						fontSize: "13px",
						fontWeight: 700,
						color: "#888",
						textTransform: "uppercase",
						letterSpacing: "0.06em",
						marginBottom: "16px",
					}}
				>
					Game Mode
				</h3>
				<ModeSelector selected={mode} onSelect={setMode} />
			</div>

			{/* Launch button */}
			<button
				type="button"
				className="tp-launch-btn"
				onClick={handleLaunch}
				disabled={!canLaunch}
				style={{
					background: canLaunch ? "#6366f1" : "#222",
					color: canLaunch ? "white" : "#555",
					border: "none",
					borderRadius: "12px",
					padding: "16px 40px",
					fontSize: "17px",
					fontWeight: 700,
					cursor: canLaunch ? "pointer" : "not-allowed",
					alignSelf: "flex-start",
					transition: "background 0.15s, transform 0.15s, box-shadow 0.15s",
					boxShadow: canLaunch ? "0 0 24px rgba(99, 102, 241, 0.25)" : "none",
				}}
				onMouseOver={(e) => {
					if (!canLaunch) return;
					e.currentTarget.style.background = "#818cf8";
					e.currentTarget.style.transform = "translateY(-2px)";
					e.currentTarget.style.boxShadow =
						"0 4px 32px rgba(99, 102, 241, 0.4)";
				}}
				onMouseOut={(e) => {
					if (!canLaunch) return;
					e.currentTarget.style.background = "#6366f1";
					e.currentTarget.style.transform = "translateY(0)";
					e.currentTarget.style.boxShadow = "0 0 24px rgba(99, 102, 241, 0.25)";
				}}
				onFocus={(e) => {
					if (!canLaunch) return;
					e.currentTarget.style.background = "#818cf8";
					e.currentTarget.style.boxShadow =
						"0 4px 32px rgba(99, 102, 241, 0.4)";
				}}
				onBlur={(e) => {
					if (!canLaunch) return;
					e.currentTarget.style.background = "#6366f1";
					e.currentTarget.style.boxShadow = "0 0 24px rgba(99, 102, 241, 0.25)";
				}}
			>
				Launch
			</button>
		</div>
	);
}

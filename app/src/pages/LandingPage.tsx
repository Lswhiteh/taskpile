import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth.js";
import { Logo } from "../components/Logo.js";

/* ------------------------------------------------------------------ */
/*  Floating card component — the little cards that drift in the hero */
/* ------------------------------------------------------------------ */

const FLOAT_COLORS = ["#ef4444", "#f97316", "#eab308", "#3b82f6", "#6366f1"];

function FloatingCard({
	color,
	style,
}: { color: string; style: React.CSSProperties }) {
	return (
		<div
			className="tp-float-card"
			style={{
				position: "absolute",
				width: "60px",
				height: "36px",
				borderRadius: "6px",
				background: color,
				opacity: 0.12,
				...style,
			}}
		/>
	);
}

/* ------------------------------------------------------------------ */
/*  Data                                                              */
/* ------------------------------------------------------------------ */

const MODES = [
	{
		title: "Free Play",
		subtitle: "Chaos mode.",
		description:
			"Every issue dumps onto the canvas at once. Throw them at walls. Make a pile. Build a fort. We won't judge.",
		color: "#6366f1",
	},
	{
		title: "Sort Challenge",
		subtitle: "Beat the clock.",
		description:
			"Issues rain from above. You have 90 seconds to drag each one into the right priority bin. Misfile and you lose points.",
		color: "#eab308",
	},
	{
		title: "Stack Attack",
		subtitle: "Defy gravity.",
		description:
			"Cards fall randomly and you stack them. One bad move and the whole tower collapses. Your PM skills, visualized.",
		color: "#ef4444",
	},
];

/* ------------------------------------------------------------------ */
/*  Reusable CTA button                                               */
/* ------------------------------------------------------------------ */

function CTAButton({
	onClick,
	children,
	size = "large",
}: {
	onClick: () => void;
	children: React.ReactNode;
	size?: "large" | "small";
}) {
	const large = size === "large";
	return (
		<button
			type="button"
			onClick={onClick}
			style={{
				background: "#6366f1",
				color: "white",
				border: "none",
				borderRadius: large ? "12px" : "10px",
				padding: large ? "16px 48px" : "12px 32px",
				fontSize: large ? "18px" : "16px",
				fontWeight: 700,
				cursor: "pointer",
				transition: "background 0.15s, transform 0.15s, box-shadow 0.15s",
				boxShadow: "0 0 24px rgba(99, 102, 241, 0.25)",
			}}
			onMouseOver={(e) => {
				e.currentTarget.style.background = "#818cf8";
				e.currentTarget.style.transform = "translateY(-2px)";
				e.currentTarget.style.boxShadow = "0 4px 32px rgba(99, 102, 241, 0.4)";
			}}
			onMouseOut={(e) => {
				e.currentTarget.style.background = "#6366f1";
				e.currentTarget.style.transform = "translateY(0)";
				e.currentTarget.style.boxShadow = "0 0 24px rgba(99, 102, 241, 0.25)";
			}}
			onFocus={(e) => {
				e.currentTarget.style.background = "#818cf8";
				e.currentTarget.style.boxShadow = "0 4px 32px rgba(99, 102, 241, 0.4)";
			}}
			onBlur={(e) => {
				e.currentTarget.style.background = "#6366f1";
				e.currentTarget.style.boxShadow = "0 0 24px rgba(99, 102, 241, 0.25)";
			}}
		>
			{children}
		</button>
	);
}

/* ------------------------------------------------------------------ */
/*  Fake issue card — used in the hero demo area                      */
/* ------------------------------------------------------------------ */

const FAKE_ISSUES = [
	{
		id: "TP-42",
		title: "Fix login redirect loop",
		priority: 1,
		color: "#ef4444",
		rotation: -6,
		x: "12%",
		y: "18%",
	},
	{
		id: "TP-108",
		title: "Add dark mode toggle",
		priority: 3,
		color: "#eab308",
		rotation: 4,
		x: "55%",
		y: "10%",
	},
	{
		id: "TP-7",
		title: "Upgrade to React 19",
		priority: 2,
		color: "#f97316",
		rotation: -3,
		x: "35%",
		y: "55%",
	},
	{
		id: "TP-256",
		title: "Write onboarding docs",
		priority: 4,
		color: "#3b82f6",
		rotation: 8,
		x: "70%",
		y: "50%",
	},
	{
		id: "TP-91",
		title: "Refactor auth middleware",
		priority: 2,
		color: "#f97316",
		rotation: -10,
		x: "8%",
		y: "60%",
	},
];

function FakeIssueCard({
	issue,
	delay,
}: {
	issue: (typeof FAKE_ISSUES)[number];
	delay: number;
}) {
	const [visible, setVisible] = useState(false);
	useEffect(() => {
		const t = setTimeout(() => setVisible(true), delay);
		return () => clearTimeout(t);
	}, [delay]);

	return (
		<div
			style={{
				position: "absolute",
				left: issue.x,
				top: issue.y,
				width: "140px",
				background: "#1a1a2e",
				borderRadius: "8px",
				padding: "10px 12px",
				borderLeft: `4px solid ${issue.color}`,
				boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
				transform: `rotate(${issue.rotation}deg) translateY(${visible ? "0" : "40px"})`,
				opacity: visible ? 1 : 0,
				transition: "all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
				cursor: "grab",
				userSelect: "none",
			}}
		>
			<div
				style={{
					fontSize: "10px",
					color: "#666",
					fontFamily: "monospace",
					marginBottom: "4px",
				}}
			>
				{issue.id}
			</div>
			<div style={{ fontSize: "12px", color: "#ccc", lineHeight: 1.3 }}>
				{issue.title}
			</div>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Main landing page                                                 */
/* ------------------------------------------------------------------ */

export function LandingPage() {
	const { login, isAuthenticated } = useAuth();

	if (isAuthenticated) {
		window.location.href = "/setup";
		return null;
	}

	// No overflow management needed — index.html defaults to auto,
	// only GamePage locks to hidden.

	return (
		<div style={{ minHeight: "100vh" }}>
			{/* --- Keyframe styles injected once --- */}
			<style>
				{`
					@keyframes tp-float {
						0%, 100% { transform: translateY(0) rotate(var(--r, 0deg)); }
						50% { transform: translateY(-18px) rotate(calc(var(--r, 0deg) + 3deg)); }
					}
					@keyframes tp-bounce {
						0%, 100% { transform: translateY(0); }
						50% { transform: translateY(-6px); }
					}
					@media (max-width: 600px) {
						.tp-landing-nav { padding: 10px 16px !important; }
						.tp-hero { padding: 100px 16px 40px !important; min-height: 90vh !important; }
						.tp-demo { display: none !important; }
						.tp-modes-section { padding: 60px 16px !important; }
						.tp-modes-grid { grid-template-columns: 1fr !important; }
						.tp-steps-section { padding: 60px 16px !important; }
						.tp-cta-section { padding: 60px 16px !important; }
						.tp-float-card { display: none !important; }
						.tp-footer { flex-direction: column !important; gap: 8px !important; }
					}
				`}
			</style>

			{/* ========== NAV ========== */}
			<nav
				className="tp-landing-nav"
				style={{
					position: "fixed",
					top: 0,
					left: 0,
					right: 0,
					zIndex: 100,
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					padding: "12px 28px",
					background: "rgba(10, 10, 26, 0.85)",
					backdropFilter: "blur(12px)",
					borderBottom: "1px solid #222244",
				}}
			>
				<div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
					<Logo size={32} />
					<span style={{ fontSize: "18px", fontWeight: 800, color: "#e0e0e0" }}>
						TaskPile
					</span>
				</div>
				<button
					type="button"
					onClick={login}
					style={{
						background: "transparent",
						color: "#6366f1",
						border: "1px solid #6366f1",
						borderRadius: "8px",
						padding: "8px 20px",
						fontSize: "14px",
						fontWeight: 600,
						cursor: "pointer",
						transition: "background 0.15s, color 0.15s",
					}}
					onMouseOver={(e) => {
						e.currentTarget.style.background = "#6366f1";
						e.currentTarget.style.color = "white";
					}}
					onMouseOut={(e) => {
						e.currentTarget.style.background = "transparent";
						e.currentTarget.style.color = "#6366f1";
					}}
					onFocus={(e) => {
						e.currentTarget.style.background = "#6366f1";
						e.currentTarget.style.color = "white";
					}}
					onBlur={(e) => {
						e.currentTarget.style.background = "transparent";
						e.currentTarget.style.color = "#6366f1";
					}}
				>
					Sign in
				</button>
			</nav>

			{/* ========== HERO ========== */}
			<section
				className="tp-hero"
				style={{
					position: "relative",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					textAlign: "center",
					minHeight: "100vh",
					padding: "120px 24px 60px",
					overflow: "hidden",
					background:
						"radial-gradient(ellipse at 50% 20%, rgba(99, 102, 241, 0.12) 0%, transparent 55%), radial-gradient(ellipse at 20% 80%, rgba(239, 68, 68, 0.06) 0%, transparent 40%), radial-gradient(ellipse at 80% 80%, rgba(59, 130, 246, 0.06) 0%, transparent 40%)",
				}}
			>
				{/* Floating decorative cards */}
				{[
					{
						color: FLOAT_COLORS[0],
						style: {
							top: "8%",
							left: "5%",
							"--r": "-12deg",
							animation: "tp-float 6s ease-in-out infinite",
						} as React.CSSProperties,
					},
					{
						color: FLOAT_COLORS[1],
						style: {
							top: "15%",
							right: "8%",
							"--r": "8deg",
							animation: "tp-float 7s ease-in-out 1s infinite",
						} as React.CSSProperties,
					},
					{
						color: FLOAT_COLORS[2],
						style: {
							bottom: "20%",
							left: "8%",
							"--r": "5deg",
							animation: "tp-float 5.5s ease-in-out 0.5s infinite",
						} as React.CSSProperties,
					},
					{
						color: FLOAT_COLORS[3],
						style: {
							bottom: "15%",
							right: "12%",
							"--r": "-7deg",
							animation: "tp-float 6.5s ease-in-out 2s infinite",
						} as React.CSSProperties,
					},
					{
						color: FLOAT_COLORS[4],
						style: {
							top: "45%",
							left: "15%",
							"--r": "15deg",
							animation: "tp-float 8s ease-in-out 1.5s infinite",
						} as React.CSSProperties,
					},
				].map((card, i) => (
					<FloatingCard
						key={`fc-${FLOAT_COLORS[i]}`}
						color={card.color}
						style={card.style}
					/>
				))}

				<div style={{ animation: "tp-bounce 3s ease-in-out infinite" }}>
					<Logo size={80} />
				</div>
				<h1
					style={{
						fontSize: "clamp(36px, 8vw, 72px)",
						fontWeight: 800,
						lineHeight: 1.05,
						maxWidth: "700px",
						margin: "20px 0",
						color: "#e0e0e0",
					}}
				>
					Your backlog,
					<br />
					<span style={{ color: "#6366f1" }}>but fun.</span>
				</h1>
				<p
					style={{
						fontSize: "clamp(16px, 2.5vw, 20px)",
						color: "#888",
						maxWidth: "480px",
						lineHeight: 1.6,
						marginBottom: "36px",
					}}
				>
					TaskPile pulls your Linear issues and turns them into physics-powered
					cards you can throw, sort, and stack. It{"'"}s the most productive way
					to procrastinate.
				</p>
				<CTAButton onClick={login}>Let{"'"}s go</CTAButton>
				<p
					style={{
						fontSize: "13px",
						color: "#444",
						marginTop: "14px",
						fontStyle: "italic",
					}}
				>
					Read-only. We promise not to close your issues.
				</p>
			</section>

			{/* ========== DEMO AREA — falling cards ========== */}
			<section
				className="tp-demo"
				style={{
					position: "relative",
					height: "420px",
					maxWidth: "700px",
					margin: "-40px auto 0",
					overflow: "hidden",
				}}
			>
				<div
					style={{
						position: "absolute",
						inset: 0,
						background: "linear-gradient(to bottom, transparent, #0a0a1a 90%)",
						zIndex: 2,
						pointerEvents: "none",
					}}
				/>
				{FAKE_ISSUES.map((issue, i) => (
					<FakeIssueCard key={issue.id} issue={issue} delay={300 + i * 200} />
				))}
				{/* Ground line */}
				<div
					style={{
						position: "absolute",
						bottom: "40px",
						left: "10%",
						right: "10%",
						height: "2px",
						background:
							"linear-gradient(to right, transparent, #333, transparent)",
					}}
				/>
			</section>

			{/* ========== GAME MODES ========== */}
			<section
				className="tp-modes-section"
				style={{
					padding: "100px 24px 80px",
					maxWidth: "960px",
					margin: "0 auto",
				}}
			>
				<h2
					style={{
						fontSize: "clamp(28px, 5vw, 36px)",
						fontWeight: 800,
						textAlign: "center",
						marginBottom: "8px",
						color: "#e0e0e0",
					}}
				>
					Three ways to avoid real work
				</h2>
				<p
					style={{
						textAlign: "center",
						color: "#666",
						fontSize: "16px",
						marginBottom: "52px",
					}}
				>
					Each one technically counts as "backlog grooming."
				</p>
				<div
					className="tp-modes-grid"
					style={{
						display: "grid",
						gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
						gap: "20px",
					}}
				>
					{MODES.map((mode) => (
						<div
							key={mode.title}
							style={{
								background: "#1a1a2e",
								borderRadius: "14px",
								padding: "28px 24px",
								border: "1px solid #222244",
								transition:
									"border-color 0.2s, transform 0.2s, box-shadow 0.2s",
								cursor: "default",
							}}
							onMouseOver={(e) => {
								e.currentTarget.style.borderColor = mode.color;
								e.currentTarget.style.transform = "translateY(-4px)";
								e.currentTarget.style.boxShadow = `0 8px 30px ${mode.color}22`;
							}}
							onMouseOut={(e) => {
								e.currentTarget.style.borderColor = "#222244";
								e.currentTarget.style.transform = "translateY(0)";
								e.currentTarget.style.boxShadow = "none";
							}}
							onFocus={(e) => {
								e.currentTarget.style.borderColor = mode.color;
								e.currentTarget.style.transform = "translateY(-4px)";
							}}
							onBlur={(e) => {
								e.currentTarget.style.borderColor = "#222244";
								e.currentTarget.style.transform = "translateY(0)";
							}}
						>
							<div
								style={{
									display: "inline-block",
									padding: "4px 12px",
									borderRadius: "6px",
									background: `${mode.color}18`,
									color: mode.color,
									fontSize: "12px",
									fontWeight: 700,
									textTransform: "uppercase",
									letterSpacing: "0.05em",
									marginBottom: "14px",
								}}
							>
								{mode.subtitle}
							</div>
							<h3
								style={{
									fontSize: "20px",
									fontWeight: 700,
									marginBottom: "10px",
									color: "#e0e0e0",
								}}
							>
								{mode.title}
							</h3>
							<p style={{ fontSize: "14px", color: "#888", lineHeight: 1.7 }}>
								{mode.description}
							</p>
						</div>
					))}
				</div>
			</section>

			{/* ========== HOW IT WORKS ========== */}
			<section
				className="tp-steps-section"
				style={{
					padding: "80px 24px",
					background:
						"linear-gradient(180deg, rgba(26,26,46,0.5) 0%, rgba(10,10,26,0) 100%)",
				}}
			>
				<div style={{ maxWidth: "800px", margin: "0 auto" }}>
					<h2
						style={{
							fontSize: "clamp(28px, 5vw, 36px)",
							fontWeight: 800,
							textAlign: "center",
							marginBottom: "56px",
							color: "#e0e0e0",
						}}
					>
						Dead simple to start
					</h2>
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							gap: "40px",
						}}
					>
						{[
							{
								num: "1",
								title: "Connect Linear",
								desc: "One click OAuth. Read-only access. We can see your issues but we'd never dream of closing them.",
							},
							{
								num: "2",
								title: "Pick your battlefield",
								desc: "Choose a team, filter by cycle or project, and pick a game mode. Or just yeet the whole backlog into Free Play.",
							},
							{
								num: "3",
								title: "Wreak havoc",
								desc: "Drag, throw, sort, and stack your issues. Card sizes scale with story points, so those 13-pointers will be satisfyingly chonky.",
							},
						].map((step) => (
							<div
								key={step.num}
								style={{
									display: "flex",
									gap: "20px",
									alignItems: "flex-start",
								}}
							>
								<div
									style={{
										flexShrink: 0,
										width: "44px",
										height: "44px",
										borderRadius: "12px",
										background: "rgba(99, 102, 241, 0.12)",
										color: "#6366f1",
										fontSize: "18px",
										fontWeight: 800,
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										border: "1px solid rgba(99, 102, 241, 0.25)",
									}}
								>
									{step.num}
								</div>
								<div>
									<h3
										style={{
											fontSize: "18px",
											fontWeight: 700,
											color: "#e0e0e0",
											marginBottom: "4px",
										}}
									>
										{step.title}
									</h3>
									<p
										style={{
											fontSize: "15px",
											color: "#888",
											lineHeight: 1.6,
										}}
									>
										{step.desc}
									</p>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* ========== BOTTOM CTA ========== */}
			<section
				className="tp-cta-section"
				style={{
					padding: "100px 24px 80px",
					textAlign: "center",
				}}
			>
				<p
					style={{
						fontSize: "14px",
						color: "#555",
						marginBottom: "12px",
						textTransform: "uppercase",
						letterSpacing: "0.1em",
						fontWeight: 600,
					}}
				>
					Your backlog isn{"'"}t going anywhere
				</p>
				<h2
					style={{
						fontSize: "clamp(28px, 5vw, 40px)",
						fontWeight: 800,
						marginBottom: "16px",
						color: "#e0e0e0",
					}}
				>
					...so you might as well play with it.
				</h2>
				<p
					style={{
						color: "#888",
						fontSize: "16px",
						marginBottom: "36px",
						maxWidth: "420px",
						margin: "0 auto 36px",
					}}
				>
					Connect your Linear workspace and start tossing issues around. It
					takes about 10 seconds.
				</p>
				<CTAButton onClick={login}>Connect Linear</CTAButton>
			</section>

			{/* ========== FOOTER ========== */}
			<footer
				className="tp-footer"
				style={{
					padding: "24px 32px",
					borderTop: "1px solid #1a1a2e",
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					gap: "16px",
					color: "#444",
					fontSize: "13px",
				}}
			>
				<span>TaskPile — the most fun you{"'"}ll ever have with a backlog</span>
				<span style={{ color: "#333" }}>|</span>
				<Link to="/privacy" style={{ color: "#555", textDecoration: "none" }}>
					Privacy & Terms
				</Link>
			</footer>
		</div>
	);
}

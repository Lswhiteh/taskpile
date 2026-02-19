import { Link } from "react-router-dom";
import { Logo } from "../components/Logo.js";

export function PrivacyPage() {
	// No overflow management needed — index.html defaults to auto,
	// only GamePage locks to hidden.

	return (
		<div style={{ minHeight: "100vh", padding: "0 24px" }}>
			{/* Nav */}
			<nav
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
				<Link
					to="/"
					style={{
						display: "flex",
						alignItems: "center",
						gap: "10px",
						textDecoration: "none",
					}}
				>
					<Logo size={32} />
					<span style={{ fontSize: "18px", fontWeight: 800, color: "#e0e0e0" }}>
						TaskPile
					</span>
				</Link>
			</nav>

			{/* Content */}
			<article
				style={{
					maxWidth: "680px",
					margin: "0 auto",
					paddingTop: "100px",
					paddingBottom: "80px",
				}}
			>
				<h1
					style={{
						fontSize: "32px",
						fontWeight: 800,
						color: "#e0e0e0",
						marginBottom: "8px",
					}}
				>
					Privacy Policy & Terms
				</h1>
				<p style={{ color: "#555", fontSize: "14px", marginBottom: "40px" }}>
					Last updated: February 2025
				</p>

				<Section title="What TaskPile is">
					<P>
						TaskPile is a free, open-source toy that visualizes your Linear
						issues as physics-powered cards. It is not a SaaS product. There are
						no accounts, no subscriptions, and no paid tiers.
					</P>
				</Section>

				<Section title="Data we access">
					<P>
						When you connect your Linear account, TaskPile requests{" "}
						<strong style={{ color: "#ccc" }}>read-only</strong> access to your
						workspace via OAuth. Specifically, we read:
					</P>
					<Ul>
						<Li>Teams, cycles, and projects (names and IDs)</Li>
						<Li>Issues (title, identifier, priority, estimate, and status)</Li>
					</Ul>
					<P>
						We do <strong style={{ color: "#ccc" }}>not</strong> read comments,
						attachments, user profiles, or any data beyond what is needed to
						render issue cards.
					</P>
				</Section>

				<Section title="Data we store">
					<P>
						<strong style={{ color: "#ccc" }}>
							TaskPile does not have a database.
						</strong>{" "}
						Your Linear OAuth tokens are stored in your browser{"'"}s{" "}
						<code style={codeStyle}>localStorage</code> and never leave your
						device. No issue data, user data, or analytics are sent to or stored
						on any server.
					</P>
					<P>
						A lightweight Cloudflare Worker proxies the OAuth token exchange
						with Linear{"'"}s API. It does not log or persist any data.
					</P>
				</Section>

				<Section title="Cookies & tracking">
					<P>
						TaskPile does not use cookies, analytics, or third-party tracking
						scripts. There is no telemetry of any kind.
					</P>
				</Section>

				<Section title="Third-party services">
					<Ul>
						<Li>
							<strong style={{ color: "#ccc" }}>Linear</strong> — OAuth
							authentication and issue data. Subject to{" "}
							<Ext href="https://linear.app/privacy">
								Linear{"'"}s Privacy Policy
							</Ext>
							.
						</Li>
						<Li>
							<strong style={{ color: "#ccc" }}>Cloudflare</strong> — Hosts the
							static site and OAuth proxy worker. Subject to{" "}
							<Ext href="https://www.cloudflare.com/privacypolicy/">
								Cloudflare{"'"}s Privacy Policy
							</Ext>
							.
						</Li>
					</Ul>
				</Section>

				<Section title="Disclaimer of warranties">
					<P>
						TaskPile is provided{" "}
						<strong style={{ color: "#ccc" }}>"as is"</strong> without warranty
						of any kind, express or implied. The authors are not responsible for
						any damages, data loss, or issues arising from the use of this
						software. Use it at your own risk.
					</P>
				</Section>

				<Section title="Limitation of liability">
					<P>
						To the fullest extent permitted by law, the authors of TaskPile
						shall not be liable for any indirect, incidental, special,
						consequential, or punitive damages, or any loss of profits or
						revenue, whether incurred directly or indirectly, arising from your
						use of the application.
					</P>
				</Section>

				<Section title="Changes to this policy">
					<P>
						We may update this policy from time to time. Changes will be
						reflected on this page with an updated date. Continued use of
						TaskPile after changes constitutes acceptance.
					</P>
				</Section>

				<Section title="Contact">
					<P>
						Questions? Open an issue on the project{"'"}s GitHub repository.
					</P>
				</Section>

				<div
					style={{
						marginTop: "48px",
						paddingTop: "24px",
						borderTop: "1px solid #1a1a2e",
					}}
				>
					<Link
						to="/"
						style={{
							color: "#6366f1",
							fontSize: "14px",
							textDecoration: "none",
						}}
					>
						&larr; Back to TaskPile
					</Link>
				</div>
			</article>
		</div>
	);
}

/* ---- Tiny helper components for consistent styling ---- */

function Section({
	title,
	children,
}: { title: string; children: React.ReactNode }) {
	return (
		<section style={{ marginBottom: "32px" }}>
			<h2
				style={{
					fontSize: "20px",
					fontWeight: 700,
					color: "#e0e0e0",
					marginBottom: "12px",
				}}
			>
				{title}
			</h2>
			{children}
		</section>
	);
}

function P({ children }: { children: React.ReactNode }) {
	return (
		<p
			style={{
				fontSize: "15px",
				color: "#999",
				lineHeight: 1.7,
				marginBottom: "12px",
			}}
		>
			{children}
		</p>
	);
}

function Ul({ children }: { children: React.ReactNode }) {
	return (
		<ul
			style={{
				paddingLeft: "20px",
				marginBottom: "12px",
			}}
		>
			{children}
		</ul>
	);
}

function Li({ children }: { children: React.ReactNode }) {
	return (
		<li
			style={{
				fontSize: "15px",
				color: "#999",
				lineHeight: 1.7,
				marginBottom: "6px",
			}}
		>
			{children}
		</li>
	);
}

function Ext({ href, children }: { href: string; children: React.ReactNode }) {
	return (
		<a
			href={href}
			target="_blank"
			rel="noopener noreferrer"
			style={{ color: "#6366f1", textDecoration: "underline" }}
		>
			{children}
		</a>
	);
}

const codeStyle: React.CSSProperties = {
	background: "#1a1a2e",
	padding: "2px 6px",
	borderRadius: "4px",
	fontSize: "13px",
	color: "#ccc",
};

/** TaskPile logo — a wobbly stack of priority-colored cards toppling over. */
export function Logo({ size = 64 }: { size?: number }) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 64 64"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			role="img"
			aria-label="TaskPile logo"
		>
			<title>TaskPile logo</title>
			{/* Bottom card — blue (Low priority) — solid base */}
			<rect
				x="10"
				y="40"
				width="40"
				height="14"
				rx="3"
				fill="#3b82f6"
				transform="rotate(-2 30 47)"
			>
				<animateTransform
					attributeName="transform"
					type="rotate"
					values="-2 30 47;-1 30 47;-2 30 47"
					dur="4s"
					repeatCount="indefinite"
				/>
			</rect>

			{/* Middle card — yellow (Normal) — slightly askew */}
			<rect
				x="12"
				y="28"
				width="36"
				height="14"
				rx="3"
				fill="#eab308"
				transform="rotate(3 30 35)"
			>
				<animateTransform
					attributeName="transform"
					type="rotate"
					values="3 30 35;5 30 35;3 30 35"
					dur="3.5s"
					repeatCount="indefinite"
				/>
			</rect>

			{/* Upper card — orange (High) — tilting more */}
			<rect
				x="14"
				y="16"
				width="32"
				height="14"
				rx="3"
				fill="#f97316"
				transform="rotate(-4 30 23)"
			>
				<animateTransform
					attributeName="transform"
					type="rotate"
					values="-4 30 23;-7 30 23;-4 30 23"
					dur="3s"
					repeatCount="indefinite"
				/>
			</rect>

			{/* Top card — red (Urgent) — about to topple! */}
			<rect
				x="16"
				y="4"
				width="28"
				height="14"
				rx="3"
				fill="#ef4444"
				transform="rotate(6 30 11)"
			>
				<animateTransform
					attributeName="transform"
					type="rotate"
					values="6 30 11;10 30 11;6 30 11"
					dur="2.5s"
					repeatCount="indefinite"
				/>
			</rect>

			{/* Little "falling" card — indigo accent — tumbling off the side */}
			<rect
				x="44"
				y="20"
				width="16"
				height="10"
				rx="2"
				fill="#6366f1"
				opacity="0.8"
				transform="rotate(25 52 25)"
			>
				<animateTransform
					attributeName="transform"
					type="rotate"
					values="25 52 25;35 52 25;25 52 25"
					dur="2s"
					repeatCount="indefinite"
				/>
			</rect>
		</svg>
	);
}

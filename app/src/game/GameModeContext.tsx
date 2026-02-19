import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
import type { GameMode, ScoreState, SortBin } from "../types/game.js";

interface GameModeContextValue {
	mode: GameMode;
	score: ScoreState;
	bins: SortBin[];
	setMode: (mode: GameMode) => void;
	addScore: (points: number) => void;
	startTimer: (seconds: number) => void;
	stopGame: () => void;
	setBins: (bins: SortBin[]) => void;
}

const GameModeCtx = createContext<GameModeContextValue | null>(null);

export function GameModeProvider({ children }: { children: React.ReactNode }) {
	const [mode, setMode] = useState<GameMode>("freePlay");
	const [score, setScore] = useState<ScoreState>({
		score: 0,
		timeRemaining: 0,
		isRunning: false,
	});
	const [bins, setBins] = useState<SortBin[]>([]);
	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const addScore = useCallback((points: number) => {
		setScore((s) => ({ ...s, score: s.score + points }));
	}, []);

	const stopGame = useCallback(() => {
		if (timerRef.current) {
			clearInterval(timerRef.current);
			timerRef.current = null;
		}
		setScore((s) => ({ ...s, isRunning: false }));
	}, []);

	const startTimer = useCallback(
		(seconds: number) => {
			stopGame();
			setScore({ score: 0, timeRemaining: seconds, isRunning: true });

			timerRef.current = setInterval(() => {
				setScore((s) => {
					if (s.timeRemaining <= 1) {
						if (timerRef.current) clearInterval(timerRef.current);
						return { ...s, timeRemaining: 0, isRunning: false };
					}
					return { ...s, timeRemaining: s.timeRemaining - 1 };
				});
			}, 1000);
		},
		[stopGame],
	);

	useEffect(() => {
		return () => {
			if (timerRef.current) clearInterval(timerRef.current);
		};
	}, []);

	return (
		<GameModeCtx.Provider
			value={{
				mode,
				score,
				bins,
				setMode,
				addScore,
				startTimer,
				stopGame,
				setBins,
			}}
		>
			{children}
		</GameModeCtx.Provider>
	);
}

export function useGameMode(): GameModeContextValue {
	const ctx = useContext(GameModeCtx);
	if (!ctx) throw new Error("useGameMode must be inside GameModeProvider");
	return ctx;
}



import type { UserType } from '../types';

export const USER_TYPE_THRESHOLDS = {

	CODER_MAX_RATIO: 0.5,

	YAPPER_MIN_RATIO: 2.0
} as const;

export const NUMBER_FORMAT_THRESHOLDS = {

	MILLIONS: 1_000_000,

	THOUSANDS: 1_000
} as const;

export const RATIO_FORMAT_THRESHOLDS = {

	SCIENTIFIC: 1_000_000,

	WHOLE_NUMBER: 1_000,

	ONE_DECIMAL: 10
} as const;

export function calculateRatio(commits: number, messages: number): number {

	if (commits === 0) {

		return messages > 0 ? Infinity : 0;
	}


	return messages / commits;
}

export function formatRatio(ratio: number): string {

	if (!isFinite(ratio)) {
		return '∞';
	}

	if (ratio === 0) {
		return '0';
	}

	const absRatio = Math.abs(ratio);


	if (absRatio >= RATIO_FORMAT_THRESHOLDS.SCIENTIFIC) {

		return ratio.toExponential(2);
	} else if (absRatio >= RATIO_FORMAT_THRESHOLDS.WHOLE_NUMBER) {

		return ratio.toFixed(0);
	} else if (absRatio >= RATIO_FORMAT_THRESHOLDS.ONE_DECIMAL) {

		return ratio.toFixed(1);
	} else {

		return ratio.toFixed(2);
	}
}

export function calculatePercentageDifference(commits: number, messages: number): string {

	if (commits === 0 && messages === 0) {
		return '0%';
	}


	if (commits === 0) {
		return '∞%';
	}


	if (messages === 0) {
		return '-100%';
	}


	const percentage = ((messages - commits) / commits) * 100;


	if (!isFinite(percentage)) {
		return percentage > 0 ? '∞%' : '-∞%';
	}


	if (Math.abs(percentage) >= 1_000_000) {
		return percentage.toExponential(2) + '%';
	}


	const absPercentage = Math.abs(percentage);
	let formatted: string;

	if (absPercentage >= 1000) {
		formatted = percentage.toLocaleString('en-US', { maximumFractionDigits: 0 });
	} else if (absPercentage >= 100) {
		formatted = percentage.toLocaleString('en-US', { maximumFractionDigits: 1 });
	} else {
		formatted = percentage.toLocaleString('en-US', { maximumFractionDigits: 2 });
	}

	return formatted + '%';
}

export function getUserType(commits: number, messages: number): UserType {

	if (commits === 0 && messages === 0) {
		return 'balanced';
	}


	if (commits === 0) {
		return 'yapper';
	}


	if (messages === 0) {
		return 'coder';
	}


	const ratio = messages / commits;


	if (ratio < USER_TYPE_THRESHOLDS.CODER_MAX_RATIO) {
		return 'coder';
	} else if (ratio > USER_TYPE_THRESHOLDS.YAPPER_MIN_RATIO) {
		return 'yapper';
	} else {
		return 'balanced';
	}
}

export function formatNumber(num: number): string {
	const absNum = Math.abs(num);

	if (absNum >= NUMBER_FORMAT_THRESHOLDS.MILLIONS) {
		return (num / NUMBER_FORMAT_THRESHOLDS.MILLIONS).toFixed(1) + 'M';
	} else if (absNum >= NUMBER_FORMAT_THRESHOLDS.THOUSANDS) {
		return (num / NUMBER_FORMAT_THRESHOLDS.THOUSANDS).toFixed(1) + 'K';
	}

	return num.toString();
}

export function formatNumberWithSeparators(num: number): string {
	return num.toLocaleString('en-US');
}

export function calculateSimilarityScore(ratio1: number, ratio2: number): number {

	if (!isFinite(ratio1) || !isFinite(ratio2)) {

		if (!isFinite(ratio1) && !isFinite(ratio2)) {
			return 0;
		}

		return Infinity;
	}

	return Math.abs(ratio1 - ratio2);
}

export function getUserTypeDescription(userType: UserType): string {
	const descriptions: Record<UserType, string> = {
		coder: 'Prioritizes coding over chatting',
		yapper: 'Loves to chat more than code',
		balanced: 'Perfect harmony between code and chat'
	};

	return descriptions[userType];
}

export function getUserTypeColors(userType: UserType): {
	bg: string;
	border: string;
	text: string;
	glow: string;
} {
	const colors: Record<UserType, { bg: string; border: string; text: string; glow: string }> = {
		coder: {
			bg: 'bg-teal-500/15',
			border: 'border-teal-500/30',
			text: 'text-teal-400',
			glow: 'shadow-teal-500/25'
		},
		yapper: {
			bg: 'bg-purple-500/15',
			border: 'border-purple-500/30',
			text: 'text-purple-400',
			glow: 'shadow-purple-500/25'
		},
		balanced: {
			bg: 'bg-amber-500/15',
			border: 'border-amber-500/30',
			text: 'text-amber-400',
			glow: 'shadow-amber-500/25'
		}
	};

	return colors[userType];
}

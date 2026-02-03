<script lang="ts">
	interface Props {
		type: 'coder' | 'yapper' | 'balanced';
		size?: 'sm' | 'md' | 'lg';
	}

	let { type, size = 'md' }: Props = $props();

	const config = {
		coder: {
			label: 'Coder',
			icon: '⌨️',
			bg: 'bg-blue-500/15',
			border: 'border-blue-500/30',
			text: 'text-blue-300',
			glow: 'shadow-blue-500/10'
		},
		yapper: {
			label: 'Yapper',
			icon: '🗣️',
			bg: 'bg-amber-500/15',
			border: 'border-amber-500/30',
			text: 'text-amber-300',
			glow: 'shadow-amber-500/10'
		},
		balanced: {
			label: 'Balanced',
			icon: '⚖️',
			bg: 'bg-emerald-500/15',
			border: 'border-emerald-500/30',
			text: 'text-emerald-300',
			glow: 'shadow-emerald-500/10'
		}
	};

	const sizeClasses = {
		sm: 'px-2 py-0.5 text-xs gap-1',
		md: 'px-3 py-1 text-sm gap-1.5',
		lg: 'px-4 py-1.5 text-base gap-2'
	};

	const badge = $derived(config[type]);
</script>

<span class="inline-flex items-center rounded-full {badge.bg} {badge.border} {badge.text} {sizeClasses[size]} border
             transition-all duration-200 ease-[cubic-bezier(0.4,0.0,0.2,1)]
             hover:scale-[1.05] hover:shadow-lg {badge.glow}">
	<span class="select-none">{badge.icon}</span>
	<span class="font-medium">{badge.label}</span>
</span>
